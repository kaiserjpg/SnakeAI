function snakeAILoopJPG(game){
    this.memory.availableSpaceNearFood = 0.91;
    this.memory.range = 4;
    this.memory.activateOccupiedSpacex3FoodRule = false;
    this.memory.activateWillGetThereFasterFoodRule = false;
    this.memory.activateAvailableRangeFoodRule = false;
    var snake = this;    
    snake.memory = determineSpaces(game, snake);
    return goTo(game, snake);

    //info gatherer manager 
    function determineSpaces(game, snake){
        var availableSpaces = [];
        var takenSpaces = game.snakes.reduce((acc,val) => acc.concat(val.body) ,[]);
        takenSpaces = takenSpaces.concat(game.obstacles);
        
        snake.memory.viableFood = getViableFood(game, snake) || [];
        //snake.memory.availableSpaces = availableSpaces;
        snake.memory.takenSpaces = takenSpaces;
        return snake.memory;
    }

    //food decision manager
    function getViableFood(game, snake) {
        var food = game.food;
        var currentDirection = snake.direction;
        var headPosition = snake.getHead();

        for(var i = 0; i < food.length ; i++){
            food[i].currentDistance = calculateDistante(food[i], headPosition);
            food[i].posibleDistance = [];
            
            //TODO: Refactor into a function that returns an array with directions positions, distance and whether is valid
            //we could add booleans to determine if distance or valid calculations are required 
            var directions = ['N', 'E', 'S', 'W'];
            for(var k = 0; k < directions.length; k++) {
                var position = predictLocation(headPosition.x, headPosition.y, directions[k], 1);
                food[i].posibleDistance.push({ direction: directions[k], position: position, 
                    distance: calculateDistante(food[i], position), snakeHead: headPosition });
            }
            food[i].posibleDistance = food[i].posibleDistance.sort(function (a, b) {
                return a.distance - b.distance;
            });
            //do some crazy stuff to predict if viable
            food[i].viable = true;
            //if there are obstacles/snakes body including head for three posible directions is not viable to get that food.  
            //TODO: Refactor into a function that returns an array with directions positions, distance and whether is valid
            //we could add booleans to determine if distance or valid calculations are required   
            //nearest food and not surronded by 3 obstacles different than your backward position    
            if (snake.memory.activateOccupiedSpacex3FoodRule == true) {
                food[i].surroundings = [];    
                // directions = ['N', 'E', 'S', 'W'];
                // var indexCurrentDirection = directions.indexOf(currentDirection);
                // if (indexCurrentDirection != -1) {
                //     directions.splice(indexCurrentDirection, 1);
                // }
                for(var k = 0; k < directions.length; k++) {
                    var position = predictLocation(food[i].x, food[i].y, directions[k], 1);
                    food[i].surroundings.push({ direction: directions[k], position: position, 
                        valid: !willCrash(game, snake.memory, position)});
                }
                var validSurroundings = food[i].surroundings.filter(function (position) {
                    return position.valid;
                }) || [];
                if (validSurroundings.length < 2) {
                    food[i].viable = false;
                    console.info("activateOccupiedSpacex3FoodRule");
                    console.log(validSurroundings);
                }
            }
            //if there is another snake 1 range closer according to the distance to get that food
            //other way to say it if a snake is in a shorter path (distance) to the food abort
            if (snake.memory.activateWillGetThereFasterFoodRule == true) {
                var enemySnakes = game.snakes.filter(function (enemy) {
                    return enemy !== snake;
                }) || [];
                for(var s = 0; s < enemySnakes.length; s++) {
                    enemySnakes[s].currentDistance = calculateDistante(food[i], enemySnakes[s].getHead());
                }
                enemySnakes = enemySnakes.sort(function(a, b) {
                    return a.currentDistance - b.currentDistance;
                });
                if (enemySnakes.length > 0) {
                    if (food[i].currentDistance > enemySnakes[0].currentDistance) {//evaluates fastest snake to get the food
                        food[i].viable = false;
                    }
                }
            }

            //if 20% of the area within the food item considering only a 4 range of around it is full of taken spaces 
            if (snake.memory.activateAvailableRangeFoodRule == true) {
                food[i].surroundings = []; 
                
                for(var x = food[i].x - snake.memory.range; x < food[i].x + snake.memory.range; x++) {
                    for(var y = food[i].y - snake.memory.range; y < food[i].y + snake.memory.range; y++) {
                        food[i].surroundings.push(new Position(x, y));
                    }
                }

                let foodArea = new Set(food[i].surroundings);
                let takenArea = new Set(snake.memory.takenSpaces);
                let availableSpace = snake.memory.takenSpaces.filter(x => foodArea.has(x)) || [];
                if((availableSpace.length / food[i].surroundings) <= snake.memory.availableSpaceNearFood) {
                    food[i].viable = false;
                    console.info("activateAvailableRangeFoodRule");
                    console.log(availableSpace);
                    console.log(food[i].surroundings);
                }
            }
        }        
        var viable = food.filter(function (item) {
            return item.viable;
        }).sort(function(a, b) {
            return a.currentDistance - b.currentDistance;
        });

        return viable;
    }
    
    //direction decision manager  (main)
    function goTo(game, snake) {
        var directions = ['N', 'E', 'S', 'W'];
        var index = Math.floor(Math.random() * directions.length);
        var newDirection = directions[index];
        var isBackwards = false;

        if (snake.memory.viableFood.length > 0) {
            //we got food
            //find nearesth distance food
            var nearestFood = snake.memory.viableFood[0];
            var location = nearestFood.posibleDistance.filter(function (location) {
                return !willCrash(game, snake.memory, location.position);
            }) || [];

            if (location.length > 0) {
                newDirection = location[0].direction;
            }
        } else {
            //activate hunting mode
            //hunt the closest bigger snake
            var headPosition = snake.getHead();
            var positionNoFood = predictLocation(headPosition.x, headPosition.y, newDirection, 1);
            while(willCrash(game, snake.memory, positionNoFood) && directions.length > 0) {
                directions.splice(index, 1);
                index = Math.floor(Math.random() * directions.length);
                newDirection = directions[index];
            }
        }

        switch(newDirection){
            case 'N':
                isBackwards = snake.direction == 'S';
                break;

            case 'E':
                isBackwards = snake.direction == 'W';
                break;

            case 'S':
                isBackwards = snake.direction == 'N';
                break;

            case 'W':
                isBackwards = snake.direction == 'E';
                break;
        }

        if (!isBackwards) {
            return newDirection;
        } 
    }

    //Get a new location base on a new direction and counter to define the range
    function predictLocation(x, y, futureDirection, counter) {
        var position = {};
        switch(futureDirection){
            case 'N':
                position = new Position(x, y - counter);
                break;
            case 'E':
                position = new Position(x + counter, y);
                break;
            case 'S':
                position = new Position(x, y + counter);
                break;
            case 'W':
                position = new Position(x - counter, y);
                break;
        }
        return position;
    }

    //dictates if the position will intercept with another object (obstacle, snake) 
    function willCrash(game, memory, position) {
        if (willCrashWithLimits(game, position)) {
            return true;
        } else {
            var dangerPosition = memory.takenSpaces.filter(x => position.intersects(x)) || [];
            if (dangerPosition.length > 0) {
                return true;
            }
        }
        return false;
    }

    //stolen/borrowed from game.js xD it verifies border collision 
    function willCrashWithLimits(game, position) {
        return position.x < 0 || position.x >= game.width || position.y < 0 || position.y >= game.height;
    }
    
    function calculateDistante(p1, p2) {    
        var x = Math.pow(p2.x - p1.x, 2);
        var y = Math.pow(p2.y - p1.y, 2);
        return Math.sqrt(x + y);
    }
};

function snakeAILoop(game){
    //Your snake code goes here, you need to return the next snake direction in this function 
    //You can use {this.memory} to persist data regarding your snake and use it in the next iteration
    
    if(!this.memory.counter){
        this.memory.counter = 0;
    }

    if(++this.memory.counter % 4 == 0){
        var directions = ['N', 'E', 'S', 'W'];
        var index = Math.floor(Math.random() * directions.length);
        var newDirection = directions[index];
        var isBackwards = false;

        switch(newDirection){
            case 'N':
                isBackwards = this.direction == 'S';
                break;

            case 'E':
                isBackwards = this.direction == 'W';
                break;

            case 'S':
                isBackwards = this.direction == 'N';
                break;

            case 'W':
                isBackwards = this.direction == 'E';
                break;
        }

        if (!isBackwards) {
            return newDirection;
        }
    }
};


function snakeAILoopJPG(game){
    this.name = "JPG";
    this.memory.offset = 3;
    this.memory.availableSpaceNearFood = 0.6;
    this.memory.range = 4;
    this.memory.activateOccupiedSpacex3FoodRule = true;
    this.memory.activateWillGetThereFasterFoodRule = true;
    this.memory.activateAvailableRangeFoodRule = true;
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
            //do some crazy stuff to predict if viable
            food[i].viable = true;
            
            //TODO: Refactor into a function that returns an array with directions positions, distance and whether is valid
            //we could add booleans to determine if distance or valid calculations are required 
            var directions = ['N', 'E', 'S', 'W'];
            for(var k = 0; k < directions.length; k++) {
                if(isBackwards(directions[k])) 
                    continue;

                var position = predictLocation(headPosition.x, headPosition.y, directions[k], 1);

                if(willCrash(game, snake.memory, position)) 
                    continue;

                food[i].posibleDistance.push({ direction: directions[k], position: position, 
                    distance: calculateDistante(food[i], position), snakeHead: headPosition });
            }
            if (food[i].posibleDistance.length > 0) {
                food[i].posibleDistance = food[i].posibleDistance.sort(function (a, b) {
                    return a.distance - b.distance;
                });
            } else {
                console.log("What?");
                food[i].viable = false;
            }
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
        var newDirection;
        var possibleSafeDirection = [];

        for(var k = 0; k < directions.length; k++) {
            if(isBackwards(directions[k])) 
                continue;

            var position = predictLocation(snake.getHead().x, snake.getHead().y, directions[k], 1);

            if(willCrash(game, snake.memory, position)) 
                continue;

            possibleSafeDirection.push({ 
                direction: directions[k], 
                position: position, 
                availableSpace: getSurroundings(position.x, position.y, snake.memory, directions[k])
            });
        }

        if (possibleSafeDirection.length > 0) {
            possibleSafeDirection = possibleSafeDirection.sort(function (a, b) {
                return a.availableSpace.length - b.availableSpace.length;
            });//TODO: Could include acceptance criteria for avaiable space to be considered safe like 90% or so.
        }
        var safestPosition = possibleSafeDirection.length > 0 ? possibleSafeDirection[0] : null;

        if (snake.memory.viableFood.length > 0) {
            //we got food
            //find nearesth distance food
            var nearestFood = snake.memory.viableFood[0];

            if (nearestFood.posibleDistance.length > 0) {
                newDirection = nearestFood.posibleDistance[0].direction;
            }
        } else {
            if (safestPosition) {
                newDirection = safestPosition.direction;
                 //activate hunting mode
                //hunt the closest bigger snake
            } else {
                console.log("No Direction? Random then.");
                // var index = Math.floor(Math.random() * directions.length);
                // newDirection = directions[index];
                // var positionInsecureAndNoFood = predictLocation(snake.getHead().x, snake.getHead().y, newDirection, 1);
                // while(willCrash(game, snake.memory, positionInsecureAndNoFood) && directions.length > 0) {
                //     directions.splice(index, 1);
                //     index = Math.floor(Math.random() * directions.length);
                //     newDirection = directions[index];
                //     positionInsecureAndNoFood = predictLocation(snake.getHead().x, snake.getHead().y, newDirection, 1);
                // }
            }
        }

        if (!newDirection) {
            newDirection = snake.direction;
        }

        if(!isBackwards(newDirection)) {
            return newDirection;
        } else {
            console.log("Backwards position shouldn't happened. Why then?");
        }
    }

    //check backwards position so you dont die by your own head xD
    function isBackwards(newDirection) {
        var isBackwards = false;
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
        
        return isBackwards;
    }

    function getSurroundings(positionX, positionY, memory, direction) {
        var surroundings = []; 
        var range = memory.range;
        var offset = memory.offset;
        switch(direction){
            case 'N':
                for(var x = positionX - range; x < positionX + range; x++) {
                    for(var y = positionY - range - offset; y < positionY + range; y++) {
                        surroundings.push(new Position(x, y));
                    }
                }
                break;

            case 'E':
                for(var x = positionX - range; x < positionX + range + offset; x++) {
                    for(var y = positionY - range; y < positionY + range; y++) {
                        surroundings.push(new Position(x, y));
                    }
                }
                break;

            case 'S':
                for(var x = positionX - range; x < positionX + range; x++) {
                    for(var y = positionY - range; y < positionY + range + offset; y++) {
                        surroundings.push(new Position(x, y));
                    }
                }
                break;

            case 'W':
                for(var x = positionX - range - offset; x < positionX + range; x++) {
                    for(var y = positionY - range; y < positionY + range; y++) {
                        surroundings.push(new Position(x, y));
                    }
                }
                break;
        } 
        let area = new Set(surroundings);
        let availableSpace = memory.takenSpaces.filter(x => area.has(x)) || [];

        return availableSpace;
    }

    //Get a new location base on a new direction and counter to define the range
    function predictLocation(x, y, futureDirection, counter) {
        var position = {};
        switch(futureDirection){
            case 'N':
                position = new Position(x, y - counter);
                break;
            case 'NE':
                position = new Position(x + counter, y + counter);
                break;
            case 'E':
                position = new Position(x + counter, y);
                break;
            case 'SE':
                position = new Position(x + counter, y - counter);
                break;
            case 'S':
                position = new Position(x, y + counter);
                break;
            case 'SW':
                position = new Position(x - counter, y + counter);
                break;
            case 'W':
                position = new Position(x - counter, y);
                break;
            case 'NW':
                position = new Position(x - counter, y - counter);
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


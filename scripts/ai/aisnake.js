function snakeAILoopJPG(game){
    
    var snake = this;  

    snake = setInfo(snake);  
    snake.memory = getInfo(game, snake);

    return goTo(game, snake);

    //info gatherer manager 
    function setInfo(snake) {
        //snake.name = "JPG";
        //snake.color = "#0099cc";
        snake.memory.offset = 10;
        snake.memory.availableSpaceNearFood = 0.49;
        snake.memory.range = 3;
        snake.memory.marginErrorForFastestSnakeToGetFood = 0.015;
        snake.memory.activateOccupiedSpacex3FoodRule = true;
        snake.memory.activateWillGetThereFasterFoodRule = true;
        snake.memory.activateAvailableRangeFoodRule = true;
        snake.memory.activateIsSurroundedFoodRule = true;
        snake.memory.paths = snake.memory.paths || [];
        snake.memory.paths.push(snake.direction);
        if(!snake.memory.counter){
            snake.memory.board = new Board(game.width, game.height);
            snake.memory.counter = 1;
        }

        return snake;
    }
    
    function Board(width,height){

        var board = [];

        for(var x = 0; x < width; x++) {
            for(var y = 0; y < height; y++) {
                board.push(new Position(x, y)); 
            }
        }
        
        return board;
        
    }

    function getInfo(game, snake){
        var takenSpaces = game.snakes.reduce((acc,val) => acc.concat(val.body) ,[]);
        takenSpaces = takenSpaces.concat(game.obstacles);
        var currentHeadIndex = takenSpaces.indexOf(snake.getHead());
        if (currentHeadIndex > -1) {
            takenSpaces.splice(currentHeadIndex, 1);
        }

        snake.memory.viableFood = getViableFood(game, snake) || [];
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
            food[i].posibleDirection = [];
            food[i].validSurroundings = []; 
            food[i].surroundings = []; 
            //do some crazy stuff to predict if viable
            food[i].viable = true;

            var directions = ['N', 'E', 'S', 'W'];
            for(var k = 0; k < directions.length; k++) {

                var foodPosition = predictLocation(food[i].x, food[i].y, directions[k], 1);

                //Not surronded by 3 obstacles different than your backward position    
                if (snake.memory.activateOccupiedSpacex3FoodRule == true) {
                    if (foodPosition.x == headPosition.x, foodPosition.y == headPosition.y) {
                        food[i].validSurroundings.push({ direction: directions[k], position: foodPosition});
                    } else {
                        if(!willCrash(game, snake.memory, foodPosition)) 
                            food[i].validSurroundings.push({ direction: directions[k], position: foodPosition});
                    }
                }   

                if(isBackwards(directions[k])) 
                    continue;  

                var snakePosition = predictLocation(headPosition.x, headPosition.y, directions[k], 1);  

                if(willCrash(game, snake.memory, snakePosition)) 
                    continue;
                
                var distance = calculateDistante(food[i], snakePosition);
                var areaData = getSurroundings(game, snakePosition.x, snakePosition.y, snake.memory, directions[k]);
                var surroundingsSpace = areaData.area.length;
                var availableSpace = areaData.availableArea.length;

                food[i].posibleDirection.push({ 
                    direction: directions[k], position: snakePosition, 
                    riskWeight: distance - (availableSpace/surroundingsSpace), 
                    snakeHead: headPosition 
                });
            }
            if (food[i].posibleDirection.length > 0) {
                food[i].posibleDirection = food[i].posibleDirection.sort(function (a, b) {
                    return a.riskWeight - b.riskWeight;
                });
            } else {
                console.log("What No posible direction to get the food? Sad face!");
                console.log(food[i]);
                food[i].viable = false;
            }
            
            //Not surronded by 3 obstacles different than your backward position    
            if (snake.memory.activateOccupiedSpacex3FoodRule == true) {
                if (food[i].validSurroundings.length < 2) {
                    food[i].viable = false;
                    console.info("activateOccupiedSpacex3FoodRule");
                    console.log(food[i].validSurroundings);
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
                    if (food[i].currentDistance*(1-snake.memory.marginErrorForFastestSnakeToGetFood) > enemySnakes[0].currentDistance) {//evaluates fastest snake to get the food
                        food[i].viable = false;
                    }
                }
            }

            //if X% of the area surrounding the food item considering (range) is full of taken spaces then abort
            if (snake.memory.activateAvailableRangeFoodRule == true) {
                var positionX = food[i].x;
                var positionY = food[i].y;
                var xLimit = game.width -1;
                var yLimit = game.height -1;
                var leftDirection = ((positionX - snake.memory.range) <= 0) ? 0 : positionX - snake.memory.range;
                var rightDirection = ((positionX + snake.memory.range) >= xLimit) ? xLimit : positionX + snake.memory.range;
                var upDirection = ((positionY - snake.memory.range) <= 0) ? 0 : positionY - snake.memory.range;
                var downDirection = ((positionY + snake.memory.range) >= yLimit) ? yLimit : positionY + snake.memory.range;
                
                for(var x = leftDirection; x < rightDirection; x++) {
                    for(var y = upDirection; y < downDirection; y++) {
                        food[i].surroundings.push(new Position(x, y));
                    }
                }

                let availableSpace = food[i].surroundings.filter(function (location) { 
                    return !snake.memory.takenSpaces.find(function (taken) { 
                        return taken.x == location.x && taken.y == location.y;
                    });	
                }) || [];

                if((availableSpace.length / food[i].surroundings.length) <= snake.memory.availableSpaceNearFood) {
                    food[i].viable = false;
                    console.info("activateAvailableRangeFoodRule");
                    console.log((availableSpace.length / food[i].surroundings.length));
                }
            }

            if (snake.memory.activateIsSurroundedFoodRule == true) {
            }

            if (food[i].viable) {
                food[i].color = snake.color;
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
            
            var areaData = getSurroundings(game, position.x, position.y, snake.memory, directions[k]);
            var surroundingsSpace = areaData.area.length;
            var availableSpace = areaData.availableArea.length;

            possibleSafeDirection.push({ 
                direction: directions[k], 
                position: position,
                riskWeight: (availableSpace/surroundingsSpace)
            });
        }

        if (possibleSafeDirection.length > 0) {
            possibleSafeDirection = possibleSafeDirection.sort(function (a, b) {
                return b.riskWeight - a.riskWeight;
            });
        }
        var safestPosition = possibleSafeDirection.length > 0 ? possibleSafeDirection[0] : null;

        if (snake.memory.viableFood.length > 0) {
            //we got food now lets find nearesth distance food
            var nearestFood = snake.memory.viableFood[0];

            if (nearestFood.posibleDirection.length > 0) {
                newDirection = nearestFood.posibleDirection[0].direction;
            }
        } else {
            if (safestPosition) {
                newDirection = safestPosition.direction;
                //activate hunting mode
                //hunt the closest bigger snake
                //body[1] intercept with other snake head
            } else {
                debugger;
                console.log("No Direction? Random then.");
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

    function getSurroundings(game, positionX, positionY, memory, direction) {
        var surroundings = []; 
        var range = memory.range;
        var offset = memory.offset;
        var xLimit = game.width -1;
        var yLimit = game.height -1;
        var leftDirection = ((positionX - range) <= 0) ? 0 : positionX - range;
        var rightDirection = ((positionX + range) >= xLimit) ? xLimit : positionX + range;
        var upDirection = ((positionY - range) <= 0) ? 0 : positionY - range;
        var downDirection = ((positionY + range) >= yLimit) ? yLimit : positionY + range;
        switch(direction){
            case 'N':
                upDirection = ((upDirection - offset) <= 0) ? 0 : upDirection - offset; ;
                break;
            case 'E':
                rightDirection = ((rightDirection + offset) >= xLimit) ? xLimit : rightDirection + offset;
                break;
            case 'S':
                downDirection = ((downDirection + offset) >= yLimit) ? yLimit : downDirection + offset;
                break;
            case 'W':
                leftDirection = ((leftDirection - offset) <= 0) ? 0 : leftDirection - offset;
                break;
        } 
        for(var x = leftDirection; x < rightDirection; x++) {
            for(var y = upDirection; y < downDirection; y++) {
                surroundings.push(new Position(x, y));
            }
        }
        
        let availableArea = surroundings.filter(function (location) { 
            return !memory.takenSpaces.find(function (taken) { 
                return taken.x == location.x && taken.y == location.y;
            });	
        }) || [];

        return { area: surroundings, availableArea: availableArea};
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


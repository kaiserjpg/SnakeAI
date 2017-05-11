function snakeAILoop(game){
    var snake = this;    
    this.memory = determineSpaces(game, snake);
    return goTo(game, snake);

    //info gatherer manager 
    function determineSpaces(game, snake){
        var availableSpaces = [];
        var takenSpaces = game.snakes.reduce((acc,val) => acc.concat(val.body) ,[]);
        takenSpaces = takenSpaces.concat(game.obstacles);
        
        for(var i = 0; i < game.width ; i++){
            for(var j = 0; j < game.height; j++){
                let newPos = new Position(i,j);
                let intersects = false;
                for(var k = 0; k < takenSpaces.length; k++){
                    if(newPos.intersects(takenSpaces[k])){
                        intersects = true;
                        break;
                    }
                }
                if(!intersects){
                    availableSpaces.push(newPos);
                }
                                
            }
        }
        
        snake.memory.viableFood = getViableFood(game.food, snake.direction, snake.getHead()) || [];
        snake.memory.availableSpaces = availableSpaces;
        snake.memory.takenSpaces = takenSpaces;
        return snake.memory;
    }

    //food decision manager
    function getViableFood(food, currentDirection, headPosition) {
        //For now dummy
        //nearest food and not surronded by 3 obstacles different than your backward position    
        for(var i = 0; i < food.length ; i++){
            food[i].currentDistance = calculateDistante(food[i], headPosition);
            food[i].posibleDistance = [];
            
            var position_north = predictLocation(headPosition.x, headPosition.y, 'N', 1);
            food[i].posibleDistance.push({ direction: 'N', position: position_north, distance: calculateDistante(food[i], position_north), snakeHead: headPosition });

            var position_east = predictLocation(headPosition.x, headPosition.y, 'E', 1);
            food[i].posibleDistance.push({ direction: 'E', position: position_east, distance: calculateDistante(food[i], position_east), snakeHead: headPosition });

            var position_south = predictLocation(headPosition.x, headPosition.y, 'S', 1);
            food[i].posibleDistance.push({ direction: 'S', position: position_south, distance: calculateDistante(food[i], position_south), snakeHead: headPosition });

            var position_west = predictLocation(headPosition.x, headPosition.y, 'W', 1);
            food[i].posibleDistance.push({ direction: 'W', position: position_west, distance: calculateDistante(food[i], position_west), snakeHead: headPosition });
            
            food[i].posibleDistance = food[i].posibleDistance.sort(function (a, b) {
                return a.distance - b.distance;
            });
            //do some crazy stuff to predict if viable
            food[i].viable = true;
            //if there are obstacles/snakes body including head for three posible directions is not viable to get that food.            


            //if there is another snake 1 range closer according to the distance to get that food


            //if 20% of the area within the food item considering only a 4 range of around it is full of taken spaces 

            // console.info(food[i]);
            // console.info(headPosition);
            // console.info(currentDirection);
        }        
        var viable = food.filter(function (item) {
            return item.viable;
        }).sort(function(a, b) {
            return a.currentDistance - b.currentDistance;
        });
        //console.log(viable);
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

    //Get a new location base on a new direction and counter to define the range
    function proyectLocation(isX, isY, game, position) {
        for(var k = 0; k < memory.takenSpaces.length; k++){

        }
        return false;        
    }

    //dictates if the position will intercept with another object (obstacle, snake) 
    function willCrash(game, memory, position) {
        for(var k = 0; k < memory.takenSpaces.length; k++){
            if(position.intersects(memory.takenSpaces[k]) || willCrashWithLimits(game, position)){
                // console.warn(position);
                // console.warn(position.intersects(memory.takenSpaces[k]));
                // console.warn(willCrashWithLimits(game, position));
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


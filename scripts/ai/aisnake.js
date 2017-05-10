function snakeAILoop(game){
    var snake = this;
    if (game.food.length > 0) {
        console.log(game.food);
    }
    
    this.memory = determineSpaces(game, this.memory, this.direction, this.getHead());
    return goTo(snake);
};

//info gatherer manager 
function determineSpaces(game, memory, direction, headPosition){
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
    
    memory.viableFood = getViableFood(game.food, direction, headPosition) || [];
    memory.availableSpaces = availableSpaces;
    memory.takenSpaces = takenSpaces;
    return memory;
}

//food decision manager
function getViableFood(food, currentDirection, headPosition) {
    //For now dummy
    //nearest food and not surronded by 3 obstacles different than your backward position    
    for(var i = 0; i < food.length ; i++){
        food[i].currentDistance = calculateDistante(food[i], headPosition);
        food[i].posibleDistance = [];
        food[i].posibleDistance.push({ direction: 'N', distance: predictDistance(food[i], headPosition, 'N', currentDirection) });
        food[i].posibleDistance.push({ direction: 'E', distance: predictDistance(food[i], headPosition, 'E', currentDirection) });
        food[i].posibleDistance.push({ direction: 'S', distance: predictDistance(food[i], headPosition, 'S', currentDirection) });
        food[i].posibleDistance.push({ direction: 'W', distance: predictDistance(food[i], headPosition, 'W', currentDirection) });
        //do some crazy stuff to predict if viable
        food[i].viable = true;
    }
    return food.filter(function (item) {
        return item.viable;
    }).sort(function(a, b) {
        return a.currentDistance - b.currentDistance;
    });
}

function predictDistance(food, snake, futureDirection, currentDirection) {
    var position = {};
    switch(futureDirection){
        case 'N':
            position = new Position(snake.x, snake.y - 1);
            break;
        case 'E':
            position = new Position(snake.x + 1, snake.y);
            break;
        case 'S':
            position = new Position(snake.x, snake.y + 1);
            break;
        case 'W':
            position = new Position(snake.x - 1, snake.y);
            break;
    }
    return calculateDistante(food, position);
}

function calculateDistante(p1, p2) {    
    var x = Math.pow(p2.x - p1.x, 2);
    var y = Math.pow(p2.y - p1.y, 2);
    return Math.sqrt(x + y);
}

//direction decision manager  (main)
function goTo(snake) {
    //go to a random if there is no food
    //var randomSpace = Math.floor(Math.random() * availableSpaces.length);
    //activate hunting mode
    //if there are obstacle for three posible directions is not viable to get that food.
    
    var directions = ['N', 'E', 'S', 'W'];
    var index = Math.floor(Math.random() * directions.length);
    var newDirection = directions[index];
    var isBackwards = false;

    if (snake.memory.viableFood.length > 0) {
        //we got food
        //find nearesth distance food 
        var nearestFood = snake.memory.viableFood[0];
        newDirection = nearestFood.posibleDistance.sort(function (a, b) {
            return a.distance - b.distance;
        })[0].direction;
        console.log(nearestFood);
        console.info("New: " + newDirection);
        console.info("Previous: " + snake.direction);
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
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
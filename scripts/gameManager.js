function GameManager(width, height, gameSpeed) {

	// Initialize game.
	var game = new Game(width, height);

	// Add static obstacles.
	game.obstacles = staticObstacles;
	addSquareOfDeath(20, 20, 20, false);
	addSquareOfDeath(60, 20, 10, false);	

	// Add AI snakes.
	addAISnakes();

	// Add random AI snakes.
	for (var i = 0; i < 0; i++) {
		let aiSnake = new Snake(Math.floor(Math.random() * game.width), Math.floor(Math.random() * game.height), {name: "AI", direction: "E", color: "#000"});
		aiSnake.loop = snakeAILoop;
		game.addSnake(aiSnake);
	};

	var loopid;

	var gameManager = {
		gameStates: [],
		startGame: startGame,
		stopGame: stopGame,
		getPlayerScores: getPlayerScores
	}

	return gameManager;

	function startGame(){

		loopid = setInterval(function() {
			let gameState = game.loop();
			gameManager.gameStates.push(gameState);

			//logGameState(gameState);

			if (isGameOver()) {
				stopGame();
			};
		}, gameSpeed);
	}

	function logGameState(gameState) {
		console.log("GAME STATE:");
		console.log("-----------------------------------");
		console.log("Current Tick: " + gameState.id);

		gameState.snakes.forEach(snake => {
			let msg = "Snake " + snake.id + ": Head(" + snake.body[0].x + "," + snake.body[0].y + "); Current Direction: '" + snake.direction + "'.";
			console.log(msg);
		});

		for (var i = 0; i < gameState.food.length; i++) {
			let msg = "Food " + i + ": Position(" + gameState.food[i].x + "," + gameState.food[i].y + ").";
			console.log(msg);
		}

		console.log("-----------------------------------");
	}

	function stopGame(){
		clearInterval(loopid);
	}

	function isGameOver() {
		return game.snakes.length <= 0;
	}

	function getPlayerScores(gameState) {
		var allPlayers = [];
		var alivePlayersScores = [];
		var deadPlayersScores = [];
		
		// Create result array.
		gameState.snakes.forEach(snake => {
			allPlayers.push({
				playerName: snake.name && snake.name !== "" ? snake.name : "Anonymous",
				score: snake.body.length - 4,
				isDead: false
			});
		});

		gameState.deadSnakes.forEach(snake => {
			allPlayers.push({
				playerName: snake.name && snake.name !== "" ? snake.name : "Anonymous",
				score: snake.body.length - 4,
				isDead: true
			});
		});

		// Sort the array.
		allPlayers.sort(function(snake1, snake2) {
			return snake2.score - snake1.score;
		});

		// Calculate positions.
		if (allPlayers.length > 0) {
			allPlayers[0].position = 1;

			for (var i = 1, pos = 1; i < allPlayers.length; i++) {
				if (allPlayers[i].score < allPlayers[i-1].score) {
					pos++;
				}

				allPlayers[i].position = pos;
			}
		}
		
		return allPlayers;
	};

	function getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++ ) {
            color += letters[Math.floor(Math.random() * 16)];
        }

        return color == "#FFFFFF" ? getRandomColor() : color;
    }

    function addSquareOfDeath(initialX, initialY, squareSize, closed) {
    	
		for (var i = initialX + (closed ? 2 : 0); i < initialX + squareSize + 1 - (closed ? 2 : 0); i++) {
			game.obstacles.push(new Position(i, initialY));
			game.obstacles.push(new Position(i, initialY + squareSize));
		}

		for (var i = initialY; i < initialY + squareSize; i++) {
			game.obstacles.push(new Position(initialX, i));
			game.obstacles.push(new Position(initialX + squareSize, i + 1));
		}
    }

	function addAISnakes() {

		var add = (name, aiFunc) => {
			let aiSnake = new Snake(Math.floor(Math.random() * game.width),Math.floor(Math.random() * game.height), {name: name, direction: "E", color: getRandomColor()});
			aiSnake.loop = aiFunc;
			game.addSnake(aiSnake);
		} 

		// Generic Random Snake.
		if (typeof(snakeAILoop) !== "undefined")
			add("Random AI XD", snakeAILoop);
		
		// add("Derick", snakeAILoopDerick);
		// add("Andrei", snakeAILoopAndrei);
		// add("Yasser", snakeAILoopYasser);
		// add("William", snakeAILoopWilliam);
		add("Jean Paul", snakeAILoopJPG);
		// add("Gallo", snakeAILoopGallo);
		// add("Aldo", snakeAILoopAldo);
		// add("Randy", snakeAILoopRandy);
		// add("Elvin", snakeAILoopElvin);
		// add("Marcos", snakeAILoopMarcos);
		// add("Gerald", snakeAILoopGerald);
		// add("Daniel", snakeAILoopDaniel);
		// add("Sergio", snakeAILoopSergio);
		// add("Miguel", snakeAILoopMiguel);
		// add("Saul", snakeAILoopSaul);
	}
}
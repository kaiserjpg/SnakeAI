(function() {
	'use strict';

	const fps = 30;

	var canvas = document.getElementById("snake-canvas").getContext("2d"),
		canvasWidth = 1200,
		canvasHeight = 600,
		cellSize = 10,
		gameSpeed = 1000 / fps,
		currentStateIndex = 0,
		isPaused = false,
		isBackwards = false,
		isStepByStepMode = false;

	var frameRequest;

	if(canvasWidth % cellSize != 0 || canvasHeight % cellSize != 0){
		throw "Invalid canvas size. Width & Height must be multiples of " + cellSize;
	}

	canvas.font = "20px Calibri";

	var gameManager = new GameManager(canvasWidth/cellSize, canvasHeight/cellSize, gameSpeed);

	function drawObstacles(obstacles){
		obstacles.forEach(position => {
			canvas.fillRect(position.x * cellSize, position.y * cellSize, cellSize, cellSize);
		});
	}
	
	function drawFood(food) {
		var current = canvas.fillStyle;
		canvas.fillStyle = "#0f0";
		food.forEach(position => {
			canvas.fillRect(position.x * cellSize, position.y * cellSize, cellSize, cellSize);
		});
		canvas.fillStyle = current;
	}

	function drawSnake(snake){
		var currentStyle = canvas.fillStyle;
		canvas.fillStyle = snake.color;

		snake.body.forEach(position => {
			canvas.fillRect(position.x * cellSize, position.y * cellSize, cellSize, cellSize);
		});

		if (snake.name && snake.name != "") {
			canvas.fillText(snake.name, (snake.body[0].x-1)*cellSize, (snake.body[0].y-1)*cellSize);
		}

		canvas.fillStyle = currentStyle;
	}

	$("#playBtn").click(function () {
		$("#playBtnContainer").hide();
		$("#backwardsBtn").prop("disabled", false);
		$("#pauseBtn").prop("disabled", false);
		$("#backward1Step").prop("disabled", false);
		$("#forward1Step").prop("disabled", false);

		$("#playerScores").show();
		$("#snakeMenu").hide();
		
		gameManager.startGame();

		refreshCanvas();
	});

	// Main reproduction buttons events.
	$("#pauseBtn").click(function () {
		isPaused = true;
		isStepByStepMode = true;

		$("#resumeBtn").prop('disabled', false);
		$("#backwardsBtn").prop('disabled', false);
		$(this).prop('disabled', true);
	});

	$("#resumeBtn").click(function () {
		isPaused = false;
		isBackwards = false;
		isStepByStepMode = false;
		
		$("#pauseBtn").prop('disabled', false);
		$("#backwardsBtn").prop('disabled', false);
		$(this).prop('disabled', true);

		refreshCanvas();
	});

	$("#backwardsBtn").click(function () {
		isPaused = false;
		isBackwards = true;
		isStepByStepMode = false;

		$("#resumeBtn").prop('disabled', false);
		$("#pauseBtn").prop('disabled', false);
		$(this).prop('disabled', true);

		refreshCanvas();
	});

	// Step by step buttons events.
	$("#backward1Step").click(function () {
		isPaused = true;
		isBackwards = true;
		isStepByStepMode = true;

		$("#pauseBtn").prop('disabled', true);
		$("#backwarsBtn").prop('disabled', false);
		$("#resumeBtn").prop('disabled', false);

		if (frameRequest)
			cancelAnimationFrame(frameRequest);

		refreshCanvas();
	});

	$("#forward1Step").click(function () {
		isPaused = true;
		isBackwards = false;
		isStepByStepMode = true;

		$("#pauseBtn").prop('disabled', true);

		if (frameRequest)
			cancelAnimationFrame(frameRequest);

		refreshCanvas();
	});

	function drawCanvas(gameState) {

		// Clear board.
		canvas.clearRect(0, 0, gameState.width * cellSize, gameState.height * cellSize);

		// Draw game elements.
		drawFood(gameState.food);

		gameState.snakes.forEach(snake => {
			drawSnake(snake);
		});

		drawObstacles(gameState.obstacles);

	}

	function refreshCanvas() {
		//console.log("States length: " + gameManager.gameStates.length + "; Current index: " + currentStateIndex);

		if (!isPaused || isStepByStepMode) {

			if (!isBackwards) {
				if (gameManager.gameStates.length > currentStateIndex) {
					drawCanvas(gameManager.gameStates[currentStateIndex]);
					refreshScores(gameManager.getPlayerScores(gameManager.gameStates[currentStateIndex]));
					currentStateIndex++;
				}
			}
			else {
				if (gameManager.gameStates.length > 0 && currentStateIndex > 0) {
					currentStateIndex--;
					drawCanvas(gameManager.gameStates[currentStateIndex]);
					refreshScores(gameManager.getPlayerScores(gameManager.gameStates[currentStateIndex]));
				}
			}
		}

		if (!isStepByStepMode)
			frameRequest = requestAnimationFrame(refreshCanvas);		
	}

	function refreshScores(playerScores) {
		var playerScoreDetailsSection = $("#playerScoresDetails");
		playerScoreDetailsSection.empty();

		for (var i = 0; i < playerScores.length; i++) {
			var playerScoreRow = $(".player-score-row-temp").clone();

			playerScoreRow.removeClass("player-score-row-temp hidden");
			playerScoreRow.find(".js-player-position").html(playerScores[i].position);
			playerScoreRow.find(".js-player-name").html(playerScores[i].playerName);
			playerScoreRow.find(".js-player-score").html(playerScores[i].score);
			playerScoreRow.find(".js-player-status").html(playerScores[i].isDead ? "DEAD" : "");
			
			playerScoreRow.appendTo(playerScoreDetailsSection);
		}
	}

})();
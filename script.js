window.onload = function() {
    const canvas = document.getElementById("gameCanvas");
    setCanvasSize();
    
    const ctx = canvas.getContext("2d");
    const scoreDisplay = document.getElementById("score");
    const stageDisplay = document.getElementById("stage");
    
    let gridSize;
    let tileCount;
    let snake = [];
    let food = {};
    let obstacles = [];
    let dx = 0;
    let dy = 0;
    let score = 0;
    let stage = 1;
    let gameSpeed = 150;
    let lastTime = 0;
    let gameActive = true;
    let gameStarted = false;
    let touchStartX = 0;
    let touchStartY = 0;

    const stages = [
        { speed: 150, obstacleCount: 0, color: "#32CD32", foodColor: "#FF4500" },
        { speed: 120, obstacleCount: 5, color: "#1E90FF", foodColor: "#FF6347" },
        { speed: 90, obstacleCount: 10, color: "#9932CC", foodColor: "#FFD700" }
    ];
    
    // const eatSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2566/2566-preview.mp3');
    const gameOverSound = new Audio('https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3');
    const levelUpSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    
    eatSound.volume = 0.3;
    gameOverSound.volume = 0.3;
    levelUpSound.volume = 0.3;
    
    function initializeGame() {
        setCanvasSize();
        calculateGridSize();
        
        snake = [{ x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }];
        generateFood();
        obstacles = [];
        
        dx = 0;
        dy = 0;
        score = 0;
        stage = 1;
        gameSpeed = stages[0].speed;
        
        scoreDisplay.textContent = `Score: ${score}`;
        stageDisplay.textContent = `Stage: ${stage}`;
        
        gameActive = true;
        gameStarted = false;
    }
    
    function setCanvasSize() {
        const containerWidth = canvas.parentElement.clientWidth;
        const size = Math.min(containerWidth, window.innerHeight * 0.6);
        
        const adjustedSize = Math.floor(size / 20) * 20;
        
        canvas.width = adjustedSize;
        canvas.height = adjustedSize;
    }
    
    function calculateGridSize() {
        if (canvas.width >= 600) {
            gridSize = 20;
        } else if (canvas.width >= 400) {
            gridSize = 16;
        } else {
            gridSize = 12;
        }
        
        tileCount = canvas.width / gridSize;
    }
    
    function drawGame(timestamp) {
        if (!gameActive) return;
        
        if (!lastTime) lastTime = timestamp;
        const elapsed = timestamp - lastTime;
        
        if (elapsed > gameSpeed) {
            lastTime = timestamp;
            
            if (gameStarted) {
                updateGame();
            }
            
            renderGame();
        }
        
        requestAnimationFrame(drawGame);
    }
    
    function updateGame() {
        if (dx === 0 && dy === 0) return;
        
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };
        snake.unshift(head);
        
        if (head.x === food.x && head.y === food.y) {
            score += 10;
            scoreDisplay.textContent = `Score: ${score}`;
            eatSound.currentTime = 0;
            eatSound.play().catch(e => console.log("Audio play error:", e));
            generateFood();
            checkStageProgression();
        } else {
            snake.pop();
        }
        
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount ||
            snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y) ||
            obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)) {
            gameOver();
            return;
        }
    }
    
    function renderGame() {
        ctx.fillStyle = "#222222";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        
        for (let i = 0; i < tileCount; i++) {
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvas.height);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvas.width, i * gridSize);
            ctx.stroke();
        }
        
        const stageColor = stages[stage - 1].color;
        snake.forEach((segment, index) => {
            const gradient = ctx.createRadialGradient(
                segment.x * gridSize + gridSize / 2, 
                segment.y * gridSize + gridSize / 2, 
                0,
                segment.x * gridSize + gridSize / 2, 
                segment.y * gridSize + gridSize / 2, 
                gridSize / 2
            );
            
            const brightness = index === 0 ? 1 : Math.max(0.6, 1 - index * 0.05);
            const headColor = index === 0 ? adjustColor(stageColor, 20) : stageColor;
            
            gradient.addColorStop(0, adjustColor(headColor, 20 * brightness));
            gradient.addColorStop(1, adjustColor(headColor, -20 * brightness));
            
            ctx.fillStyle = gradient;
            
            roundRect(
                ctx, 
                segment.x * gridSize + 1, 
                segment.y * gridSize + 1, 
                gridSize - 2, 
                gridSize - 2, 
                index === 0 ? gridSize / 3 : gridSize / 4
            );
            
            if (index === 0) {
                let eyeOffsetX1, eyeOffsetY1, eyeOffsetX2, eyeOffsetY2;
                
                if (dx === 1) {
                    eyeOffsetX1 = eyeOffsetX2 = gridSize * 0.7;
                    eyeOffsetY1 = gridSize * 0.3;
                    eyeOffsetY2 = gridSize * 0.7;
                } else if (dx === -1) { 
                    eyeOffsetX1 = eyeOffsetX2 = gridSize * 0.3;
                    eyeOffsetY1 = gridSize * 0.3;
                    eyeOffsetY2 = gridSize * 0.7;
                } else if (dy === 1) {
                    eyeOffsetX1 = gridSize * 0.3;
                    eyeOffsetX2 = gridSize * 0.7;
                    eyeOffsetY1 = eyeOffsetY2 = gridSize * 0.7;
                } else {
                    eyeOffsetX1 = gridSize * 0.3;
                    eyeOffsetX2 = gridSize * 0.7;
                    eyeOffsetY1 = eyeOffsetY2 = gridSize * 0.3;
                }
                
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(segment.x * gridSize + eyeOffsetX1, segment.y * gridSize + eyeOffsetY1, gridSize * 0.15, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(segment.x * gridSize + eyeOffsetX2, segment.y * gridSize + eyeOffsetY2, gridSize * 0.15, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = "black";
                ctx.beginPath();
                ctx.arc(segment.x * gridSize + eyeOffsetX1, segment.y * gridSize + eyeOffsetY1, gridSize * 0.07, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(segment.x * gridSize + eyeOffsetX2, segment.y * gridSize + eyeOffsetY2, gridSize * 0.07, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        const foodColor = stages[stage - 1].foodColor;
        ctx.fillStyle = foodColor;
    
        const pulseSize = 0.1 * Math.sin(Date.now() / 200) + 0.9;
        const foodSize = (gridSize / 2 - 2) * pulseSize;
        
        ctx.beginPath();
        ctx.arc(
            food.x * gridSize + gridSize / 2, 
            food.y * gridSize + gridSize / 2, 
            foodSize, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(
            food.x * gridSize + gridSize * 0.35, 
            food.y * gridSize + gridSize * 0.35, 
            foodSize * 0.4, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        obstacles.forEach(obstacle => {
            const obstacleGradient = ctx.createRadialGradient(
                obstacle.x * gridSize + gridSize / 2,
                obstacle.y * gridSize + gridSize / 2,
                0,
                obstacle.x * gridSize + gridSize / 2,
                obstacle.y * gridSize + gridSize / 2,
                gridSize
            );
            
            obstacleGradient.addColorStop(0, "#a0a0a0");
            obstacleGradient.addColorStop(1, "#606060");
            
            ctx.fillStyle = obstacleGradient;
            
            ctx.beginPath();
            const centerX = obstacle.x * gridSize + gridSize / 2;
            const centerY = obstacle.y * gridSize + gridSize / 2;
            const radius = gridSize / 2 - 2;
            const spikes = 8;
            
            for (let i = 0; i < spikes * 2; i++) {
                const angle = (i * Math.PI) / spikes;
                const spikeRadius = i % 2 === 0 ? radius : radius * 0.6;
                const x = centerX + spikeRadius * Math.cos(angle);
                const y = centerY + spikeRadius * Math.sin(angle);
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            ctx.beginPath();
            ctx.arc(
                obstacle.x * gridSize + gridSize * 0.35,
                obstacle.y * gridSize + gridSize * 0.35,
                radius * 0.3,
                0,
                Math.PI * 2
            );
            ctx.fill();
        });
        
        if (!gameStarted && dx === 0 && dy === 0) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = `${Math.max(16, canvas.width / 20)}px 'Press Start 2P', cursive`;
            ctx.textAlign = "center";
            ctx.fillStyle = "#FFD700";
            ctx.fillText("Press Arrow Keys", canvas.width / 2, canvas.height / 2 - 20);
            ctx.fillText("or Swipe up", canvas.width / 2, canvas.height / 2 + 20);
            ctx.fillText("to Start", canvas.width / 2, canvas.height / 2 + 60);
        }
    }
    
    function generateFood() {
        let attempts = 0;
        const maxAttempts = 100;
        do {
            food.x = Math.floor(Math.random() * tileCount);
            food.y = Math.floor(Math.random() * tileCount);
            attempts++;
        } while (isOccupied(food.x, food.y) && attempts < maxAttempts);
        
        if (attempts >= maxAttempts) {
            console.log("No space for food, but continuing game...");
        }
    }
    
    function generateObstacles(count) {
        obstacles = [];
        let attempts = 0;
        const maxAttempts = 100;
        
        const minDistanceFromHead = 3;
        
        while (obstacles.length < count && attempts < maxAttempts) {
            const obstacle = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };
            
            const head = snake[0];
            const distanceFromHead = Math.sqrt(
                Math.pow(obstacle.x - head.x, 2) + Math.pow(obstacle.y - head.y, 2)
            );
            
            if (!isOccupied(obstacle.x, obstacle.y) && distanceFromHead >= minDistanceFromHead) {
                obstacles.push(obstacle);
            }
            attempts++;
        }
    }
    
    function isOccupied(x, y) {
        return snake.some(segment => segment.x === x && segment.y === y) ||
               obstacles.some(obstacle => obstacle.x === x && obstacle.y === y) ||
               (food.x === x && food.y === y);
    }
    //Haris Zubair (FAST)
    function checkStageProgression() {
        if (score >= 30 && stage === 1) {
            stage = 2;
            gameSpeed = stages[1].speed;
            levelUpSound.currentTime = 0;
            levelUpSound.play().catch(e => console.log("Audio play error:", e));
            generateObstacles(stages[1].obstacleCount);
            stageDisplay.textContent = `Stage: ${stage}`;
            
            showLevelUpMessage("Stage 2!");
        } else if (score >= 60 && stage === 2) {
            stage = 3;
            gameSpeed = stages[2].speed;
            levelUpSound.currentTime = 0;
            levelUpSound.play().catch(e => console.log("Audio play error:", e));
            generateObstacles(stages[2].obstacleCount);
            stageDisplay.textContent = `Stage: ${stage}`;
            
            showLevelUpMessage("Stage 3!");
        }
    }
    
    function showLevelUpMessage(message) {
        const levelUpDiv = document.createElement("div");
        levelUpDiv.textContent = message;
        levelUpDiv.style.position = "absolute";
        levelUpDiv.style.top = "50%";
        levelUpDiv.style.left = "50%";
        levelUpDiv.style.transform = "translate(-50%, -50%)";
        levelUpDiv.style.color = "#FFD700";
        levelUpDiv.style.fontSize = "3rem";
        levelUpDiv.style.fontFamily = "'Press Start 2P', cursive";
        levelUpDiv.style.textShadow = "0 0 10px rgba(255, 215, 0, 0.7)";
        levelUpDiv.style.zIndex = "100";
        levelUpDiv.style.pointerEvents = "none";
        
        document.body.appendChild(levelUpDiv);
        
        let opacity = 1;
        const fadeInterval = setInterval(() => {
            if (opacity <= 0) {
                clearInterval(fadeInterval);
                document.body.removeChild(levelUpDiv);
            } else {
                opacity -= 0.02;
                levelUpDiv.style.opacity = opacity;
            }
        }, 20);
    }
    
    function gameOver() {
        gameActive = false;
        gameOverSound.play().catch(e => console.log("Audio play error:", e));
        
        setTimeout(() => {
            alert(`Game Over! Score: ${score} | Stage: ${stage}`);
            resetGame();
        }, 500);
    }
    
    function resetGame() {
        initializeGame();
        requestAnimationFrame(drawGame);
    }
    
    function roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
        ctx.fill();
    }
    
    function adjustColor(color, amount) {
        let usePound = false;
        
        if (color[0] === "#") {
            color = color.slice(1);
            usePound = true;
        }
        
        const num = parseInt(color, 16);
        let r = (num >> 16) + amount;
        let g = ((num >> 8) & 0x00FF) + amount;
        let b = (num & 0x0000FF) + amount;
        
        r = Math.min(Math.max(0, r), 255);
        g = Math.min(Math.max(0, g), 255);
        b = Math.min(Math.max(0, b), 255);
        
        const newColor = (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
        return (usePound ? "#" : "") + newColor;
    }
    
    window.addEventListener("resize", () => {
        setCanvasSize();
        calculateGridSize();
    });
    
    document.addEventListener("keydown", (e) => {
        if (!gameStarted && (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight")) {
            gameStarted = true;
        }
        
        switch (e.key) {
            case "ArrowUp":
                if (dy !== 1) { dx = 0; dy = -1; }
                break;
            case "ArrowDown":
                if (dy !== -1) { dx = 0; dy = 1; }
                break;
            case "ArrowLeft":
                if (dx !== 1) { dx = -1; dy = 0; }
                break;
            case "ArrowRight":
                if (dx !== -1) { dx = 1; dy = 0; }
                break;
        }
    });
    
    const upBtn = document.getElementById("upBtn");
    const downBtn = document.getElementById("downBtn");
    const leftBtn = document.getElementById("leftBtn");
    const rightBtn = document.getElementById("rightBtn");
    
    upBtn.addEventListener("click", () => {
        if (dy !== 1) { dx = 0; dy = -1; gameStarted = true; }
    });
    
    downBtn.addEventListener("click", () => {
        if (dy !== -1) { dx = 0; dy = 1; gameStarted = true; }
    });
    
    leftBtn.addEventListener("click", () => {
        if (dx !== 1) { dx = -1; dy = 0; gameStarted = true; }
    });
    
    rightBtn.addEventListener("click", () => {
        if (dx !== -1) { dx = 1; dy = 0; gameStarted = true; }
    });
    
    canvas.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener("touchmove", (e) => {
        if (!touchStartX || !touchStartY) return;
        
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        if (Math.abs(deltaX) > 30 || Math.abs(deltaY) > 30) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 0 && dx !== -1) {
                    dx = 1;
                    dy = 0;
                } else if (deltaX < 0 && dx !== 1) {
                    dx = -1;
                    dy = 0;
                }
            } else {
                if (deltaY > 0 && dy !== -1) {
                    dx = 0;
                    dy = 1;
                } else if (deltaY < 0 && dy !== 1) {
                    dx = 0;
                    dy = -1;
                }
            }
            
            touchStartX = touchEndX;
            touchStartY = touchEndY;
            gameStarted = true;
        }
        
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener("touchend", () => {
        touchStartX = 0;
        touchStartY = 0;
    });
    
    initializeGame();
    requestAnimationFrame(drawGame);
};

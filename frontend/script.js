// Configuration
const SQUARE_SIZE = 20;
const ANIMATION_SPEED = 100;
const API_URL = 'http://localhost:3000';

// Global variables
let maze = [];
let canvas, ctx;
let currentPath = [];
let animationIndex = 0;
let animationTimer = null;

// Canvas drawing functions
function initCanvas() {
    canvas = document.getElementById('mazeCanvas');
    ctx = canvas.getContext('2d');
}

function drawMaze() {
    if (!maze.length) return;
    
    const rows = maze.length;
    const cols = maze[0].length;
    
    canvas.width = cols * SQUARE_SIZE;
    canvas.height = rows * SQUARE_SIZE;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const x = j * SQUARE_SIZE;
            const y = i * SQUARE_SIZE;
            
            // Draw cell
            ctx.fillStyle = maze[i][j] === 0 ? 'white' : 'black';
            ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
            
            // Draw border
            ctx.strokeStyle = '#ccc';
            ctx.strokeRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
            
            // Draw start (yellow)
            if (i === 0 && j === 0) {
                ctx.fillStyle = 'gold';
                ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
                ctx.fillStyle = 'black';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('S', x + SQUARE_SIZE/2, y + SQUARE_SIZE/2 + 4);
            }
            
            // Draw end (green)
            if (i === rows-1 && j === cols-1) {
                ctx.fillStyle = 'lightgreen';
                ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
                ctx.fillStyle = 'black';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('E', x + SQUARE_SIZE/2, y + SQUARE_SIZE/2 + 4);
            }
        }
    }
}

function animatePath(path) {
    currentPath = path;
    animationIndex = 0;
    
    if (animationTimer) clearInterval(animationTimer);
    
    drawMaze(); // Reset maze
    
    animationTimer = setInterval(() => {
        if (animationIndex >= currentPath.length) {
            // Draw final path
            drawFinalPath(currentPath);
            clearInterval(animationTimer);
            return;
        }
        
        const [row, col] = currentPath[animationIndex];
        const x = col * SQUARE_SIZE + SQUARE_SIZE / 2;
        const y = row * SQUARE_SIZE + SQUARE_SIZE / 2;
        
        // Draw moving ant
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(x, y, SQUARE_SIZE / 4, 0, 2 * Math.PI);
        ctx.fill();
        
        animationIndex++;
    }, ANIMATION_SPEED);
}

function drawFinalPath(path) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    for (let i = 0; i < path.length - 1; i++) {
        const [row1, col1] = path[i];
        const [row2, col2] = path[i + 1];
        const x1 = col1 * SQUARE_SIZE + SQUARE_SIZE / 2;
        const y1 = row1 * SQUARE_SIZE + SQUARE_SIZE / 2;
        const x2 = col2 * SQUARE_SIZE + SQUARE_SIZE / 2;
        const y2 = row2 * SQUARE_SIZE + SQUARE_SIZE / 2;
        
        if (i === 0) ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
    }
    
    ctx.stroke();
}

// API communication
async function generateMaze() {
    const size = parseInt(document.getElementById('mazeSize').value);
    
    try {
        const response = await fetch(`${API_URL}/generate-maze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ size })
        });
        
        if (!response.ok) throw new Error('Failed to generate maze');
        
        const data = await response.json();
        maze = data.maze;
        drawMaze();
        document.getElementById('solveBtn').disabled = false;
        
        // Hide results
        document.getElementById('resultsDiv').style.display = 'none';
    } catch (error) {
        console.error('Error generating maze:', error);
        alert('Failed to generate maze. Please try again.');
    }
}

async function solveMaze() {
    if (!maze.length) return;
    
    // Show loading
    document.getElementById('loadingDiv').style.display = 'block';
    document.getElementById('resultsDiv').style.display = 'none';
    document.getElementById('solveBtn').disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/solve-maze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ maze })
        });
        
        if (!response.ok) throw new Error('Failed to solve maze');
        
        const { attempts, bestPath, bestLength } = await response.json();
        
        // Hide loading
        document.getElementById('loadingDiv').style.display = 'none';
        
        // Display results
        displayResults(attempts, bestPath, bestLength);
        
        // Animate best path
        if (bestPath) {
            setTimeout(() => animatePath(bestPath), 500);
        }
    } catch (error) {
        console.error('Error solving maze:', error);
        alert('Failed to solve maze. Please try again.');
        document.getElementById('loadingDiv').style.display = 'none';
    } finally {
        document.getElementById('solveBtn').disabled = false;
    }
}

function displayResults(attempts, bestPath, bestLength) {
    const attemptsList = document.getElementById('attemptsList');
    const bestLengthSpan = document.getElementById('bestLength');
    const pathDisplay = document.getElementById('pathDisplay');
    
    // Clear previous results
    attemptsList.innerHTML = '';
    
    // Display attempts
    attempts.forEach(attempt => {
        const div = document.createElement('div');
        div.className = `attempt ${attempt.success && attempt.length === bestLength ? 'best' : 'normal'}`;
        
        if (attempt.success) {
            div.innerHTML = `
                <span>Attempt ${attempt.attempt}</span>
                <span>${attempt.length} steps ${attempt.length === bestLength ? '🏆' : ''}</span>
            `;
        } else {
            div.innerHTML = `
                <span>Attempt ${attempt.attempt}</span>
                <span style="color: #dc3545;">No path found</span>
            `;
        }
        
        attemptsList.appendChild(div);
    });
    
    // Display best path
    if (bestPath) {
        bestLengthSpan.textContent = bestLength;
        pathDisplay.textContent = bestPath.map(([r, c]) => `(${r}, ${c})`).join(' → ');
    } else {
        bestLengthSpan.textContent = 'No path found';
        pathDisplay.textContent = 'ACO failed to find a solution';
    }
    
    document.getElementById('resultsDiv').style.display = 'block';
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initCanvas();
    generateMaze();
    
    document.getElementById('generateBtn').addEventListener('click', generateMaze);
    document.getElementById('solveBtn').addEventListener('click', solveMaze);
});
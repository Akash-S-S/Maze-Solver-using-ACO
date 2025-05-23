const express = require('express');
const cors = require('cors');
const path = require('path');
const { generateRandomMaze, MazeSolverACO } = require('./aco-solver');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Endpoints
app.post('/generate-maze', (req, res) => {
    const { size } = req.body;
    const maze = generateRandomMaze(size, size);
    res.json({ maze });
});

app.post('/solve-maze', (req, res) => {
    const { maze } = req.body;
    const rows = maze.length;
    const cols = maze[0].length;
    
    const attempts = [];
    let bestOverallPath = null;
    let bestLength = Infinity;
    
    for (let attempt = 0; attempt < 5; attempt++) {
        const solver = new MazeSolverACO(maze, [0, 0], [rows-1, cols-1]);
        const path = solver.solve();
        
        if (path && path.length > 0) {
            attempts.push({
                attempt: attempt + 1,
                length: path.length,
                path: path,
                success: true
            });
            
            if (path.length < bestLength) {
                bestOverallPath = path;
                bestLength = path.length;
            }
        } else {
            attempts.push({
                attempt: attempt + 1,
                length: null,
                path: null,
                success: false
            });
        }
    }
    
    res.json({ attempts, bestPath: bestOverallPath, bestLength });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
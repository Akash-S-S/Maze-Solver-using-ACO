// Maze generation
function generateRandomMaze(rows, cols) {
    let maze = Array(rows).fill().map(() => 
        Array(cols).fill().map(() => Math.random() < 0.2 ? 1 : 0)
    );
    maze[0][0] = 0; // Start
    maze[rows-1][cols-1] = 0; // End
    return maze;
}

// ACO Solver Class
class MazeSolverACO {
    constructor(maze, start, end) {
        this.maze = maze;
        this.start = start;
        this.end = end;
        this.rows = maze.length;
        this.cols = maze[0].length;
        this.pheromone = Array(this.rows).fill().map(() => Array(this.cols).fill(1));
        this.evaporationRate = 0.5;
        this.alpha = 1;
        this.beta = 2;
        this.antCount = 40;
        this.iterations = 300;
        this.bestPath = [];
        this.bestPathLength = Infinity;
    }

    solve(maxTotalIterations = 2000, maxNoImprove = 300) {
        let noImproveCounter = 0;
        let iteration = 0;

        while (iteration < maxTotalIterations && noImproveCounter < maxNoImprove) {
            let allPaths = [];
            let improved = false;

            for (let i = 0; i < this.antCount; i++) {
                let path = this.generatePath();
                if (path) {
                    allPaths.push(path);
                    if (path.length < this.bestPathLength) {
                        this.bestPath = [...path];
                        this.bestPathLength = path.length;
                        improved = true;
                    }
                }
            }

            this.evaporatePheromone();
            this.updatePheromone(allPaths);

            noImproveCounter = improved ? 0 : noImproveCounter + 1;
            iteration++;
        }

        return this.bestPath;
    }

    generatePath() {
        let current = [...this.start];
        let path = [current];
        let visited = new Set([current.toString()]);
        let maxSteps = this.rows * this.cols * 2; // Prevent infinite loops
        let steps = 0;

        while (current[0] !== this.end[0] || current[1] !== this.end[1]) {
            if (steps++ > maxSteps) return null;

            let neighbors = this.getNeighbors(current);
            if (neighbors.length === 0) return null;

            let weights = neighbors.map(neighbor => {
                if (visited.has(neighbor.toString())) return 0;
                let [x, y] = neighbor;
                return Math.pow(this.pheromone[x][y], this.alpha);
            });

            if (weights.every(w => w === 0)) return null;

            let totalWeight = weights.reduce((sum, w) => sum + w, 0);
            let probs = weights.map(w => w / totalWeight);
            
            let nextCell = this.chooseWeighted(neighbors, probs);
            if (visited.has(nextCell.toString())) return null;

            visited.add(nextCell.toString());
            path.push(nextCell);
            current = nextCell;
        }

        return path;
    }

    chooseWeighted(options, weights) {
        let rand = Math.random();
        let cumSum = 0;
        for (let i = 0; i < options.length; i++) {
            cumSum += weights[i];
            if (rand <= cumSum) return options[i];
        }
        return options[options.length - 1];
    }

    getNeighbors(cell) {
        let [i, j] = cell;
        let neighbors = [];
        
        if (i > 0 && this.maze[i-1][j] === 0) neighbors.push([i-1, j]);
        if (i < this.rows-1 && this.maze[i+1][j] === 0) neighbors.push([i+1, j]);
        if (j > 0 && this.maze[i][j-1] === 0) neighbors.push([i, j-1]);
        if (j < this.cols-1 && this.maze[i][j+1] === 0) neighbors.push([i, j+1]);
        
        return neighbors;
    }

    evaporatePheromone() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.pheromone[i][j] *= (1 - this.evaporationRate);
            }
        }
    }

    updatePheromone(paths) {
        for (let path of paths) {
            let contribution = 1 / path.length;
            for (let [i, j] of path) {
                this.pheromone[i][j] += contribution;
            }
        }
    }
}

module.exports = {
    MazeSolverACO,
    generateRandomMaze
};
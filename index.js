const BLOCK_SIZE = 30; // px
const BLOCK_GAP = 3; // px
const BLOCK_OUTLINE = BLOCK_SIZE + BLOCK_GAP;

class Block {
  hovered = false;
  wall = false;
  spawn = false;
  target = false;

  closed = false;
  parent;

  gCost = 0;
  hCost = 0;

  get fCost() {
    return this.gCost + this.hCost;
  }

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  getColor() {
    if (this.wall) {
      return "blue";
    } else if (this.spawn) {
      return "yellow";
    } else if (this.target) {
      return "green";
    } else if (this.closed) {
      return "red";
    } else if (this.fCost > 0) {
      return "orange";
    } else {
      return "white";
    }
  }

  /**
   * Returns all blocks which are surrounding this block:
   * [?] [?] [?]
   * [?] [X] [?]
   * [?] [?] [?]
   *
   * @param {Block[][]} blocks all blocks
   * @returns {Block[]} all surrounding  blocks which aren't walls
   */
  getNeighbors(blocks) {
    const neighbors = [];
    for (let y = -1; y <= 1; y++) {
      for (let x = -1; x <= 1; x++) {
        if (
          !(x === 0 && y === 0) &&
          blocks[this.y - y] != undefined &&
          blocks[this.y - y][this.x - x] != undefined
        ) {
          neighbors.push(blocks[this.y - y][this.x - x]);
        }
      }
    }
    return neighbors.filter(block => !block.wall);
  }

  /**
   * Calculates the move cost by calculating the shortest possible path between this block and the target
   * @param {number} x target x
   * @param {number} y target y
   */
  calculateMoveCost(x, y) {
    const deltaX = Math.abs(this.x - x);
    const deltaY = Math.abs(this.y - y);
    if (deltaX > deltaY) {
      return deltaY * Math.SQRT2 + deltaX - deltaY;
    } else {
      return deltaX * Math.SQRT2 + deltaY - deltaX;
    }
  }

  /**
   * Converts the coordinates of the block to coordinates which can be used to draw on the canvas
   */
  toCanvasCoordinates() {
    return {
      x: BLOCK_GAP + BLOCK_OUTLINE * this.x,
      y: BLOCK_GAP + BLOCK_OUTLINE * this.y
    };
  }
}

class World {
  blocks = [];

  /**
   * 0 = no mouse button down
   * 1 = left mouse button down
   * 3 = right mouse button down
   */
  currentMouseButton = 0;

  placeWalls = true;
  placeSpawn = false;
  placeTarget = false;

  constructor(sizeX, sizeY) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;

    this.fillWorld();
    this.setupCanvas();
    this.render();
    this.addMouseMoveListener();
    this.addMouseClickListener();
  }

  /**
   * Creates a new canvas element, gives it the correct size and appends it to the body
   */
  setupCanvas() {
    this.canvas = document.createElement("canvas");

    this.canvas.width = BLOCK_OUTLINE * this.sizeX + BLOCK_GAP;
    this.canvas.height = BLOCK_OUTLINE * this.sizeY + BLOCK_GAP;

    document.body.appendChild(this.canvas);
    this.context = this.canvas.getContext("2d");
  }

  /**
   * Fills the blocks array with Blocks
   */
  fillWorld() {
    for (let y = 0; y < this.sizeY; y++) {
      this.blocks[y] = [];
      for (let x = 0; x < this.sizeX; x++) {
        this.blocks[y][x] = new Block(x, y);
      }
    }
  }

  /**
   * Renders the world
   */
  render() {
    // Draw a black background
    this.context.fillStyle = "black";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw a square for each block
    this.blocks.flat().forEach(block => {
      this.context.fillStyle = block.getColor();
      const { x, y } = block.toCanvasCoordinates();

      // If the block is hovered, the square will be bigger than normal
      if (block.hovered) {
        this.context.fillRect(
          x - BLOCK_GAP / 2,
          y - BLOCK_GAP / 2,
          BLOCK_OUTLINE,
          BLOCK_OUTLINE
        );
      } else {
        this.context.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
      }

      //Render the fCost of each block
      if (block.fCost > 0) {
        this.context.textAlign = "center";
        this.context.fillStyle = "black";
        this.context.font = "12px sans-serif";

        this.context.fillText(
          Math.round(block.fCost * 10) / 10,
          BLOCK_OUTLINE * block.x + BLOCK_GAP + BLOCK_SIZE / 2,
          BLOCK_OUTLINE * block.y + BLOCK_GAP + BLOCK_SIZE * 0.75
        );
      }
    });

    if (this.path) {
      this.context.fillStyle = "white";
      this.context.lineWidth = 6;
      this.context.strokeStyle = "white";
      for (let i = 0; i < this.path.length; i++) {
        const pathBlock = this.path[i];
        let { x, y } = pathBlock.toCanvasCoordinates();
        x += BLOCK_SIZE / 2;
        y += BLOCK_SIZE / 2;

        // Draw dots
        this.context.beginPath();
        this.context.arc(x, y, 8, 0, Math.PI * 2);
        this.context.closePath();
        this.context.fill();

        // Draw connecting lines
        if (i + 1 < this.path.length) {
          this.context.beginPath();
          this.context.moveTo(x, y);
          let { x: nextX, y: nextY } = this.path[i + 1].toCanvasCoordinates();
          nextX += BLOCK_SIZE / 2;
          nextY += BLOCK_SIZE / 2;
          this.context.lineTo(nextX, nextY);
          this.context.closePath();
          this.context.stroke();
        }
      }
    }

    requestAnimationFrame(_ => this.render());
  }

  /**
   * Returns the block over which the mouse is currently located
   * @param {number} cursorX the x coordinate of the mouse cursor relative to the top-right corner of the canvas
   * @param {number} cursorY the y coordinate of the mouse cursor relative to the top-right corner of the canvas
   * @returns {Block} when a no matching block was found, undefined will be returned
   */
  raycastBlock(cursorX, cursorY) {
    cursorX -= BLOCK_GAP / 2;
    cursorY -= BLOCK_GAP / 2;

    const x = Math.floor(cursorX / BLOCK_OUTLINE);
    const y = Math.floor(cursorY / BLOCK_OUTLINE);

    if (x < 0 || x >= this.sizeX || y < 0 || y >= this.sizeY) {
      return undefined; // no block was found
    }
    return this.blocks[y][x];
  }

  setSpawn() {
    this.placeWalls = false;
    this.placeSpawn = true;
    this.placeTarget = true;
  }

  setTarget() {
    this.placeWalls = false;
    this.placeSpawn = false;
    this.placeTarget = true;
  }

  worldSetupCompleted() {
    this.placeWalls = false;
    this.placeSpawn = false;
    this.placeTarget = false;
    this.path = this.findBestPath();
  }

  /**
   * @param {MouseEvent} event
   */
  onMouseUpdate(event) {
    const canvasBoundingRect = this.canvas.getBoundingClientRect();
    const currentBlock = this.raycastBlock(
      event.clientX - canvasBoundingRect.x,
      event.clientY - canvasBoundingRect.y
    );

    if (this.lastBlock) this.lastBlock.hovered = false;
    if (currentBlock) {
      if (this.placeWalls) {
        if (this.currentMouseButton === 1) {
          currentBlock.wall = true;
        } else if (this.currentMouseButton === 3) {
          currentBlock.wall = false;
        }
      } else if (this.currentMouseButton === 1 && !currentBlock.wall) {
        if (this.placeSpawn) {
          currentBlock.spawn = true;
          this.spawnBlock = currentBlock;
          this.setTarget();
        } else if (this.placeTarget && !currentBlock.spawn) {
          currentBlock.target = true;
          this.targetBlock = currentBlock;
          this.worldSetupCompleted();
        }
      }

      currentBlock.hovered = true;
      this.lastBlock = currentBlock;
    }
  }

  addMouseMoveListener() {
    window.onmousemove = event => this.onMouseUpdate(event);
  }

  addMouseClickListener() {
    window.onmousedown = event => {
      this.currentMouseButton = event.which;
      this.onMouseUpdate(event);
    };

    // Set the current mouse button to 0 when the mouse button was released
    window.onmouseup = event => {
      if (this.currentMouseButton === event.which) {
        this.currentMouseButton = 0;
      }
    };

    window.onblur = _ => (this.currentMouseButton = 0);

    // Don't open the context menu on the canvas
    this.canvas.oncontextmenu = event => event.preventDefault();
  }

  /**
   * Finds the best path using the A* path finding algorithm
   */
  findBestPath() {
    if (!this.spawnBlock || !this.targetBlock)
      throw "No spawn and/or target block was specified";

    const open = [this.spawnBlock];

    while (open.length > 0) {
      open.sort((a, b) => a.fCost - b.fCost).reverse(); // Sort the array so that the block with the lowest F cost is the last element
      const current = open.pop(); // Get the last element (-> the block with the lowest F cost) and remove it from the open array

      // If the current block is the target block, the path was found
      if (current === this.targetBlock) {
        const path = [current];
        // Trace back the path from the current block to the start block
        let currentBlock = current;
        while (currentBlock.parent != undefined) {
          path.push(currentBlock.parent);
          currentBlock = currentBlock.parent;
        }
        path.reverse(); // Reverse the path so that the first element is the spawn and the last element is the target
        // Return the path
        return path;
      }

      // Declare the current block as closed
      current.closed = true;

      // Get all neighbors of the current block (which aren't a wall)
      const neighbors = current.getNeighbors(this.blocks);
      neighbors.forEach(neighbor => {
        // If the neighbor is is closed, skip it
        if (neighbor.closed) return;

        const newGCost =
          current.gCost + neighbor.calculateMoveCost(current.x, current.y);
        if (open.indexOf(neighbor) > -1) {
          // If the neighbor is already in the open list, check if the recalculated G cost is better than it's current G cost
          if (newGCost < neighbor.gCost) {
            // If so, set the new G cost and the current block as new parent
            neighbor.gCost = newGCost;
            neighbor.parent = current;
          }
        } else {
          // If the neighbor isn't already in the open list:
          // Calculate/set the G cost and H cost
          neighbor.gCost = newGCost;
          neighbor.hCost = neighbor.calculateMoveCost(
            this.targetBlock.x,
            this.targetBlock.y
          );
          // Set the current block as parent of the neighbor
          neighbor.parent = current;
          // Add the neighbor to the open list
          open.push(neighbor);
        }
      });
    }

    // If the loop was completed, no path could be found :(
    alert("No path could be found :(");
  }
}

const world = new World(30, 30);

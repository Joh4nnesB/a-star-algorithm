const BLOCK_SIZE = 30; // px
const BLOCK_GAP = 3; // px
const BLOCK_OUTLINE = BLOCK_SIZE + BLOCK_GAP;

class Block {
  hovered = false;
  wall = false;
  spawn = false;
  target = false;

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
    } else {
      return "white";
    }
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
   * Renders all the blocks to the canvas
   */
  render() {
    // Draw a black background
    this.context.fillStyle = "black";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw a square for each block
    this.blocks.flat().forEach(block => {
      this.context.fillStyle = block.getColor();
      // If the block is hovered, the square will be bigger than normal
      if (block.hovered) {
        this.context.fillRect(
          BLOCK_OUTLINE * block.x + BLOCK_GAP / 2,
          BLOCK_OUTLINE * block.y + BLOCK_GAP / 2,
          BLOCK_OUTLINE,
          BLOCK_OUTLINE
        );
      } else {
        this.context.fillRect(
          BLOCK_OUTLINE * block.x + BLOCK_GAP,
          BLOCK_OUTLINE * block.y + BLOCK_GAP,
          BLOCK_SIZE,
          BLOCK_SIZE
        );
      }
    });

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
          this.setTarget();
        } else if (this.placeTarget && !currentBlock.spawn) {
          currentBlock.target = true;
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
}

const world = new World(30, 30);

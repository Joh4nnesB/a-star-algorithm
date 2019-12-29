const BLOCK_SIZE = 30; // px
const BLOCK_GAP = 3; // px
const BLOCK_OUTLINE = BLOCK_SIZE + BLOCK_GAP;

class Block {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class World {
  blocks = [];

  constructor(sizeX, sizeY) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;

    this.fillWorld();
    this.setupCanvas();
    this.render();
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
    // draw a black background
    this.context.fillStyle = "black";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    //draw a square for each block
    this.blocks.flat().forEach(block => {
      this.context.fillStyle = "white";
      this.context.fillRect(
        BLOCK_OUTLINE * block.x + BLOCK_GAP,
        BLOCK_OUTLINE * block.y + BLOCK_GAP,
        BLOCK_SIZE,
        BLOCK_SIZE
      );
    });
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
}

const world = new World(30, 30);

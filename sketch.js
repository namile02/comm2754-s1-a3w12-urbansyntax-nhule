let shapeImg;
let leafImgs = [];
let buildingImgs = [];

const density = 0.8;

let lastMouseX;
let treeRotation = 0;
const maxRotation = Math.PI / 20;
let treeOffsetX = 0;
const maxOffsetX = 80;

let trees = [];
let leafSize;

let magnifyMode = true;  // Always on, no toggle

const magnifyRadius = 50;
const magnifyScale = 1; // max size bằng leafSize

let saveRequested = false;  // flag for saving canvas

let magX = 0;
let magY = 0;
const magLerpSpeed = 0.5;

let saveBuffer;

let frameMode = false;
let justEnteredFrameMode = false;

let svg1, svg2, svg3;

// --- SOUNDS ---
let hoverSound;
let ambientSound;
let ambientPlaying = false;
let isHovering = false;

let hoverStartTime = 0;
let hoverDuration = 0;
let soundLength = 0;

let lastMousePos = null;



// Thêm biến pool âm thanh hover:
let hoverSoundPool = [];
const HOVER_POOL_SIZE = 5; // Số bản âm thanh có thể chồng lên nhau
let hoverSoundIndex = 0;


function preload() {
  shapeImg = loadImage('assets/treemask.png');
  for (let i = 1; i <= 4; i++) leafImgs.push(loadImage(`assets/leaf-0${i}.png`));
  for (let i = 1; i <= 5; i++) buildingImgs.push(loadImage(`assets/building-0${i}.png`));

  svg1 = loadImage('assets/frame.png');  // Replace with your SVG filenames
  svg2 = loadImage('assets/QUOTE.svg');
  svg3 = loadImage('assets/CTA.svg');

    // Load hover sounds nhiều bản giống nhau
  for(let i = 0; i < HOVER_POOL_SIZE; i++) {
    hoverSoundPool[i] = loadSound('assets/growing-building.WAV');
  }
  ambientSound = loadSound('assets/ambient.WAV');
}

function setup() {
    pixelDensity(1);   // thêm dòng này để tắt scaling theo DPR
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('canvas-container');
  frameRate(30);

  saveBuffer = createGraphics(windowWidth, windowHeight);

  lastMouseX = mouseX;
  magX = mouseX;
  magY = mouseY;


  shapeImg.loadPixels();
  if (!shapeImg.pixels.length) {
    console.error('Image not loaded!');
    noLoop();
    return;
  }

  leafSize = random(30, 50);

  generateTrees(); // initial tree generation

 // Start ambient sound loop after user interaction (required by browser policies)
  userStartAudio().then(() => {
    ambientSound.setLoop(false);
    ambientSound.setVolume(0);
    ambientSound.play();
    ambientPlaying = false;
  });
}

// Hàm phát hover sound từ pool
function playHoverSound() {
  if(hoverSoundPool[hoverSoundIndex].isPlaying()) {
    hoverSoundPool[hoverSoundIndex].stop();
  }
  hoverSoundPool[hoverSoundIndex].play();
  hoverSoundIndex = (hoverSoundIndex + 1) % HOVER_POOL_SIZE;
}

function generateTrees() {
  trees = [];

  const treeCount = floor(random(4, 7));
  for (let i = 0; i < treeCount; i++) {
    let scaleFactor = random(1.2, 1.6);
    let xEven = map(i, 0, treeCount - 1, 0, width);
    let baseX = xEven + random(-width / treeCount * 0.3, width / treeCount * 0.3);
    let baseY = height - (shapeImg.height * scaleFactor) / 2;
    let tree = new Tree(baseX, baseY, scaleFactor);
    tree.prepareLeavesAndBuildings();
    trees.push(tree);
  }
}

function draw() {
  background('#F2E1B6');

  if (!frameMode) {
    treeRotation = lerp(treeRotation, 0, 0.1);
    treeOffsetX = lerp(treeOffsetX, 0, 0.1);

    for (let t of trees) {
      t.update();
      t.display();
    }

    magX = lerp(magX, mouseX, magLerpSpeed);
    magY = lerp(magY, mouseY, magLerpSpeed);

    cursor(ARROW);

   // Tính tốc độ di chuột đơn giản (px/frame)
    let mouseSpeed = 0;
    if (lastMousePos) {
      mouseSpeed = dist(mouseX, mouseY, lastMousePos.x, lastMousePos.y);
    }
    lastMousePos = createVector(mouseX, mouseY);

   // Check hover
    let hoveringAny = false;
    for (let tree of trees) {
      for (let building of tree.buildings) {
        if (dist(mouseX, mouseY, building.pos.x, building.pos.y) < magnifyRadius) {
          hoveringAny = true;
          break;
        }
      }
      if (hoveringAny) break;
    }

  if (hoveringAny && !isHovering && isSoundOn) {
  playHoverSound();
  isHovering = true;
} else if (!hoveringAny && isHovering) {
  isHovering = false;
}



  } else {
    // Pause mode: just draw static trees & overlays

    push();
    translate(width / 2 + treeOffsetX, height / 2);
    rotate(treeRotation);
    translate(-width / 2, -height / 2);
    for (let t of trees) {
      for (let item of t.leavesAndBuildings) {
        item.obj.display();
      }
    }
    pop();


    // SVG overlays centered
   imageMode(CORNER); // draw from top-left corner
image(svg1, 0, 0, width, height);  // full screen svg1 stretched to canvas
    
    push();
    imageMode(CENTER);
translate(550, 220);
scale(0.8);  // ví dụ thu nhỏ 50%
image(svg2, 0, 0);
pop();
    
     push();
    imageMode(CENTER);
translate(1450, 1000);
scale(0.8);  // ví dụ thu nhỏ 50%
image(svg3, 0, 0);
pop();

    if (justEnteredFrameMode) {
      saveCanvas('postcard', 'png');
      justEnteredFrameMode = false;
    }

  }

  if (saveRequested) {
    drawTreesOnBuffer(saveBuffer);
    saveBuffer.save('tree_canopy.png');
    saveRequested = false;
  }
}

function keyPressed() {
  if (keyCode === ENTER) {
    frameMode = !frameMode;

    // grab the nav bar (and wrapper if you want to hide icons too)
    const nav    = document.getElementById('nav');
    const icons  = document.getElementById('icon-wrapper');
    const popup  = document.getElementById('info-popup');

 if (frameMode) {
  resizeCanvas(1920, 1080);
  noLoop();
  justEnteredFrameMode = true;
    nav.style.display         = 'none';
      icons.style.display       = 'none';
      popup.style.display       = 'none'; 
      isSoundOn = false; // optional, if you want to force-hide it
} else {
  resizeCanvas(windowWidth, windowHeight);
  loop();
  justEnteredFrameMode = false;
   nav.style.display         = 'flex';  // or 'block' depending on your #nav CSS
      icons.style.display       = 'block';
      isSoundOn = true;
}
  } else if (key === 's' || key === 'S') {
      saveRequested = true;
      
    } else if (key === 'r' || key === 'R') {
      generateTrees();
    }
  
}



function mousePressed() {
  if (magnifyMode) {
    for (let tree of trees) {
      for (let building of tree.buildings) {
        if (dist(mouseX, mouseY, building.pos.x, building.pos.y) < magnifyRadius) {
          building.locked = true;
        }
      }
    }
  }
}


function drawTreesOnBuffer(g) {
  g.clear();

  g.push();
  g.translate(width / 2 + treeOffsetX, height / 2);
  g.rotate(treeRotation);
  g.translate(-width / 2, -height / 2);

  for (let t of trees) {
    for (let item of t.leavesAndBuildings) {
      if (item.obj.displayOnGraphics) {
        item.obj.displayOnGraphics(g);
      } else {
        item.obj.display();
      }
    }
  }

  g.pop();
}

// Classes Tree, Leaf, Building (unchanged) ...

class Tree {
  constructor(x, y, scale) {
    this.baseX = x;
    this.baseY = y;
    this.scaleFactor = scale;
    this.leaves = [];
    this.buildings = [];
    this.leavesAndBuildings = [];

    let leaf1 = random(leafImgs);
    let leaf2;
    do {
      leaf2 = random(leafImgs);
    } while (leaf2 === leaf1);

    const baseStep = 100;
    const step = constrain(baseStep / leafSize, 12, 20);

    for (let yy = 0; yy < shapeImg.height; yy += step) {
      for (let xx = 0; xx < shapeImg.width; xx += step) {
        let idx = 4 * (yy * shapeImg.width + xx);
        if (
          shapeImg.pixels[idx] < 50 &&
          shapeImg.pixels[idx + 3] > 128 &&
          random() < density
        ) {
          let ox = random(-step / 3, step / 3);
          let oy = random(-step / 3, step / 3);
          let px = this.baseX + (xx + ox) * this.scaleFactor;
          let py = this.baseY + (yy + oy) * this.scaleFactor;
          this.leaves.push(new Leaf(px, py, random([leaf1, leaf2])));
        }
      }
    }
  }

  prepareLeavesAndBuildings() {
    this.buildings = this.leaves.map((leaf) => {
      let img = random(buildingImgs);
      return new Building(leaf.basePos.x, leaf.basePos.y, img, leafSize);
    });

    this.leavesAndBuildings = [];
    for (let i = 0; i < this.leaves.length; i++) {
      this.leavesAndBuildings.push({
        type: 'leaf',
        obj: this.leaves[i],
        y: this.leaves[i].basePos.y,
      });
      this.leavesAndBuildings.push({
        type: 'building',
        obj: this.buildings[i],
        y: this.leaves[i].basePos.y,
      });
    }
    this.leavesAndBuildings.sort((a, b) => a.y - b.y);
  }

  update() {
    this.leaves.forEach((l) => l.update());
    this.buildings.forEach((b) => b.update());
  }

  display() {
    push();
    translate(width / 2 + treeOffsetX, height / 2);
    rotate(treeRotation);
    translate(-width / 2, -height / 2);
    for (let item of this.leavesAndBuildings) {
      item.obj.display();
    }
    pop();
  }
}

class Leaf {
  constructor(x, y, img) {
    this.basePos = createVector(x, y);
    this.img = img;
    this.phase = random(TWO_PI);
    this.speed = random(0.08, 0.5);
    this.amplitude = random(10, 30);
    this.opacity = random(150, 255);
  }

  update() {
    this.phase += this.speed;
  }

  display() {
    push();
    noStroke();
    let offsetX = sin(this.phase) * this.amplitude;
    translate(this.basePos.x + offsetX, this.basePos.y);
    rotate(sin(this.phase * 1.5) * 0.2);
    imageMode(CENTER);
    tint(255, this.opacity);
    let w = leafSize;
    let h = (w * this.img.height) / this.img.width;
    image(this.img, 0, 0, w, h);
    pop();
    noTint();
  }

  displayOnGraphics(g) {
    g.push();
    g.noStroke();
    let offsetX = sin(this.phase) * this.amplitude;
    g.translate(this.basePos.x + offsetX, this.basePos.y);
    g.rotate(sin(this.phase * 1.5) * 0.2);
    g.imageMode(CENTER);
    g.tint(255, this.opacity);
    let w = leafSize;
    let h = (w * this.img.height) / this.img.width;
    g.image(this.img, 0, 0, w, h);
    g.pop();
    g.noTint();
  }
}

class Building {
  constructor(x, y, img, size) {
    this.pos = createVector(x, y);
    this.img = img;
    this.baseW = size * 1.5;
    this.baseH = this.baseW * (img.height / img.width);
    this.currScale = 0;
    this.targetScale = 0;
    this.speed = 0.4;
    this.locked = false;
  }

  update() {
    if (!this.locked) {
      if (
        magnifyMode &&
        dist(mouseX, mouseY, this.pos.x, this.pos.y) < magnifyRadius
      ) {
        this.targetScale = magnifyScale;
      } else {
        this.targetScale = 0;
      }
      this.currScale = lerp(this.currScale, this.targetScale, this.speed);
    }
  }

  display() {
    if (this.currScale <= 0.01) return;
    push();
    imageMode(CENTER);
    noTint();
    let w = this.baseW * this.currScale;
    let h = this.baseH * this.currScale;
    image(this.img, this.pos.x, this.pos.y, w, h);
    pop();
  }

  displayOnGraphics(g) {
    if (this.currScale <= 0.01) return;
    g.push();
    g.imageMode(CENTER);
    g.noTint();
    let w = this.baseW * this.currScale;
    let h = this.baseH * this.currScale;
    g.image(this.img, this.pos.x, this.pos.y, w, h);
    g.pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  saveBuffer.resizeCanvas(windowWidth, windowHeight);
}

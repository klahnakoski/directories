function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(220);
  ellipse(windowWidth / 2, windowHeight / 2, 50, 50);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
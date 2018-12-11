// Get canvas element and create canvas context
var canvas = document.getElementById("flight-control");
var ctx = canvas.getContext("2d");

// Scale of drawn vector
var scale = 1;

class Airplane {
  /**
     * @param {number} x - x coordinate at start
     * @param {number} y - y coordinate at start
     * @param {number} a - azimuth angle <0; 360) of the airplane's vector
     * @param {number} m - magnitude of the airplane's vector
     */
  constructor(x, y, a, m) {
    this.x = x;
    this.y = y;
    this.a = a * (Math.PI / 180); // Converting to radians
    this.m = m;
  }

  // Returns airplane coordinates if t units of time have passed
  getPos(t) {
    let x = this.x + Math.sin(this.a) * this.m * t;
    let y = this.y - Math.cos(this.a) * this.m * t;
    return [x, y];
  }

  // Returns the end position of the plane, that is when x = 800 or y = 800 or x = 0 or y = 0
  getPathEnd() {
    // point in time at which x = 800 or x = 0
    var tx = (800 - this.x) / (Math.sin(this.a) * this.m);
    if (tx < 0) {
      tx = (0 - this.x) / (Math.sin(this.a) * this.m);
    }

    // point in time at which y = 800 or y = 0
    var ty = (this.y - 800) / (Math.cos(this.a) * this.m);
    if (ty < 0) {
      ty = (this.y - 0) / (Math.cos(this.a) * this.m);
    }

    var t = Math.min(tx, ty);

    return this.getPos(t);
  }

  // Returns a random point between 20% and 90% of airplane path
  getRandomCrossingPoint(context) {
    var start = [this.x, this.y];
    var end = this.getPathEnd();

    var coefficient = Math.random() * (7 / 10) + 0.2;

    let crossingPoint = [
      start[0] + coefficient * (end[0] - start[0]),
      start[1] + coefficient * (end[1] - start[1])
    ];

    return crossingPoint;
  }

  // This affects the length of the drawn vector and has no effect on calculations
  changeVectorScale(scale) {
    this.vectorScale = scale;
  }

  // Draws the starting position: a 10x10 white square with center in (x, y)
  drawPos(canvasContext) {
    canvasContext.fillStyle = 'white';
    canvasContext.fillRect(this.x - 5, this.y - 5, 10, 10);
  }

  // Draws the vector. The drawn magnitude is this.m * this.vectorScale.
  drawVector(canvasContext) {
    let xEnd = this.x + Math.sin(this.a) * this.m * scale;
    let yEnd = this.y - Math.cos(this.a) * this.m * scale;

    canvasContext.beginPath();
    canvasContext.moveTo(this.x, this.y);
    canvasContext.lineTo(xEnd, yEnd);
    canvasContext.strokeStyle = "#FFFFFF";
    canvasContext.lineWidth = 1;
    canvasContext.stroke();
  }

}

/** 
 * Returns time of closest approach
 *
 * @input {Airplane} a1
 * @input {Airplane} a2
 */
function timeOfClosestApproach(a1, a2) {
  // Calculating initial displacement
  const dx = a2.x - a1.x;
  const dy = a2.y - a1.y;
  
  // Calculating displacement vector
  const vx = a2.m * Math.sin(a2.a) - a1.m * Math.sin(a1.a);
  const vy = - a2.m * Math.cos(a2.a) + a1.m * Math.cos(a1.a);

  // Calculaing time of mininum displacement (closest approach)
  const t = - (dx * vx + dy * vy) / (Math.pow(vx, 2) + Math.pow(vy, 2));

  return t;
}

/**
 * Returns distance in miles (1 mile = 8 pixels) between two points. String with two-digit precision
 * Each point is an array of two coordinates: [x, y].
 */
function getDistance(point1, point2) {
  const xOffset = point2[0] - point1[0];
  const yOffset = point2[1] - point1[1];

  return (Math.sqrt(Math.pow(xOffset, 2) + Math.pow(yOffset, 2)) / 8).toFixed(2);
}

// Getting canvas coordinates from an event
function relMouseCoords(event){
  var totalOffsetX = 0;
  var totalOffsetY = 0;
  var canvasX = 0;
  var canvasY = 0;
  var currentElement = this;

  do {
    totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
    totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
  } while (currentElement = currentElement.offsetParent)

  canvasX = event.pageX - totalOffsetX;
  canvasY = event.pageY - totalOffsetY;

  return [canvasX, canvasY];
}
HTMLCanvasElement.prototype.mouseCoords = relMouseCoords;

function generateFirstAirplane() {
  let x = Math.round(Math.random() * 700 + 50);
  let y = Math.round(Math.random() * 700 + 50);

  let m = Math.random() * 40 + 30;

  let a = Math.random() * 110;
  if (x <= 400 && y <= 400) {
    a += 80;
  } else if (x > 400 && y <= 400) {
    a += 170;
  } else if (x > 400 && y > 400) {
    a += 260;
  } else if (x <= 400 && y > 400) {
    a += 350;
  }
  a = a % 360;

  return new Airplane(x, y, a, m);
}

function generateSecondAirplane(firstAirplane, context) {
  let x = Math.round(Math.random() * 700 + 50);
  let y = Math.round(Math.random() * 700 + 50);

  let m = Math.random() * 40 + 30;

  let crossingPoint = firstAirplane.getRandomCrossingPoint(context);

  let a = Math.atan2(crossingPoint[1] - y, crossingPoint[0] - x) * 180 / Math.PI + 90;
  if (a < 0) {
    a = 360 + a;
  }

  return new Airplane(x, y, a, m);
}

// Clearing canvas and saving state
function clear() {
  ctx.clearRect(0, 0, 800, 800);
  ctx.save();

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 800, 800);
}

var airplane1;
var airplane2;

// Assign new Airplane instances to global variables
function newAirplanes() {

  airplane1 = generateFirstAirplane();
  airplane2 = generateSecondAirplane(airplane1, ctx);

  console.log(airplane1);
  console.log(airplane2);

}

// Clearing canvas and drawing airplane positions and vectors
function draw() {

  clear();

  if (!verify()) {
    return;
  }

  airplane1.drawPos(ctx);
  airplane1.drawVector(ctx);
  airplane2.drawPos(ctx);
  airplane2.drawVector(ctx);

}

// Getting positions at closest approach, drawing the correct line and displaying distances
function check() {
  let t = timeOfClosestApproach(airplane1, airplane2);
  let pos1 = airplane1.getPos(t);
  let pos2 = airplane2.getPos(t);

  ctx.beginPath();
  ctx.moveTo(pos1[0], pos1[1]);
  ctx.lineTo(pos2[0], pos2[1]);
  ctx.strokeStyle = "#FF0000";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Drawing correct distance
  const correctDist = getDistance(pos1, pos2);
  ctx.font = "14px Arial";
  ctx.fillStyle = "red";
  ctx.fillText(correctDist, userLineEnd[0] + 40, userLineEnd[1] - 20);

  // Drawing user's distance
  const userDist = getDistance(userLineBeggining, userLineEnd);
  ctx.fillStyle = "green";
  ctx.fillText(userDist, userLineEnd[0] + 40, userLineEnd[1]);

}

// Checking if closest approach is within bounds. Generating new planes if not
function verify() {
  let t = timeOfClosestApproach(airplane1, airplane2);
  let pos1 = airplane1.getPos(t);
  let pos2 = airplane2.getPos(t);

  if (t < 0) {
    reset();
    return false;
  }

  if (pos1[0] < 0 || pos1[0] > 800 || pos1[1] < 0 || pos1[1] > 800) {
    reset();
    return false;
  }

  if (pos2[0] < 0 || pos2[0] > 800 || pos2[1] < 0 || pos2[1] > 800) {
    reset();
    return false;
  }

  return true;
}

function reset() {
  newAirplanes();
  draw();
}

function rescale(s) {
  scale = s;
  draw();
}

// Generating airplanes and drawing for the first time after page loads
newAirplanes();
draw();

// Drawing the line. Start on mousedown, end on mouseup.
var userLineBeggining = [];
var userLineEnd = [];

canvas.addEventListener('mousedown', function(event) {
  draw();
  let coords = canvas.mouseCoords(event);
  userLineBeggining = coords;

  ctx.beginPath();
  ctx.moveTo(coords[0], coords[1]);
}, false);

canvas.addEventListener('mouseup', function(event) {
  let coords = canvas.mouseCoords(event);
  userLineEnd = coords;

  ctx.lineTo(coords[0], coords[1]);
  ctx.strokeStyle = "#00FF00";
  ctx.lineWidth = 1;
  ctx.stroke();
  
}, false);
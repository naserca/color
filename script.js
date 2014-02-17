// canvas

function Canvas(args) {
  this.elem = args.elem;
  this.ctx = this.elem.getContext('2d');
  this.width = args.width;
  this.height = args.height;
  this.middleX = this.width / 2;
  this.middleY = this.height / 2;
  this.color = {};
}

Canvas.prototype.draw = function() {
  this.ctx.fillStyle = this.color.string();
  this.ctx.fillRect(0, 0, this.width, this.height);
};

Canvas.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
}

Canvas.prototype.getRadius = function(pageX, pageY) {
  return Math.sqrt(Math.pow(pageX - this.middleX, 2) + Math.pow(pageY - this.middleY, 2));
}

// color

function Color(canvas) {
  this.hsv = { h: 1, s: 1, v: 1 };
  this.canvas = canvas;
  this.convertToRgb();
}

Color.prototype.changeH = function(pageX, pageY) {
  var referenceX = this.canvas.middleX,
      referenceY = this.canvas.middleY - this.canvas.getRadius(pageX, pageY);
  var degrees = (2 * Math.atan2(pageY - referenceY, pageX - referenceX)) * 180 / Math.PI;
  this.hsv.h = degrees / 360;
}

Color.prototype.changeS = function(radius) {
  this.hsv.s = (isWithinCircle(radius)) ? radius / maxRadius : 1;
}

Color.prototype.changeV = function(distanceDiff) {
  var rawV = this.hsv.v - distanceDiff;
  if (rawV > 1)
    this.hsv.v = 1;
  else if (rawV < 0)
    this.hsv.v = 0;
  else
    this.hsv.v = rawV;
}

Color.prototype.string = function() {
  return "rgb("+this.rgb.r+","+this.rgb.g+","+this.rgb.b+")";
}

Color.prototype.convertToRgb = function() {
  var r, g, b, i, f, p, q, t,
      h = this.hsv.h,
      s = this.hsv.s,
      v = this.hsv.v;

  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }

  this.rgb =  {
    r: Math.floor(r * 255),
    g: Math.floor(g * 255),
    b: Math.floor(b * 255)
  };
}

// runner

var $body, bodyWidth, bodyHeight, middleX, middleY,
    shortestSideLength, longestSideLength, maxRadius,
    $canvas;

$body = document.body;
$canvas = document.getElementById('canvas');
bodyWidth = getComputedStyle($body)['width'].replace(/\D/g, '');
bodyHeight = getComputedStyle($body)['height'].replace(/\D/g, '');

isLandscape = (bodyWidth - bodyHeight >= 0);
shortestSideLength = isLandscape ? bodyHeight : bodyWidth;
maxRadius = shortestSideLength / 2;

$canvas.style.width = bodyWidth + "px";
$canvas.style.height = bodyHeight + "px";
ctx = $canvas.getContext('2d');

function isWithinCircle(radius) {
  return radius <= maxRadius;
}

function animate(canvas) {
  canvas.draw(canvas.color);

  var animationId = window.requestAnimationFrame(function(){
    animate(canvas)
  });

  animationIds.push(animationId);
}

var animationIds = [];

var canvas, color, args;

args = {
  elem: $canvas,
  width: bodyWidth,
  height: bodyHeight
};
canvas       = new Canvas(args);
color        = new Color(canvas);
canvas.color = color;

Hammer($body).on("drag", function(ev) {
  if (!pinching) {
    var pageX = ev.gesture.center.pageX,
        pageY = ev.gesture.center.pageY,
        radius = canvas.getRadius(pageX, pageY);

    canvas.color.changeH(pageX, pageY);
    canvas.color.changeS(radius);
    canvas.color.convertToRgb();
  }
});

// pinch

function Pinch(args) {
  this.maxDistance = 200;
  this.distance = this.getDistance(args.pageX, args.pageY, args.middleX, args.middleY);
}

Pinch.prototype.getDistance = function(pageX, pageY, middleX, middleY) {
  return Math.sqrt(Math.pow(pageX - middleX, 2) + Math.pow(pageY - middleY, 2));
}

Pinch.prototype.getDiffMultiplier = function(pageX, pageY, middleX, middleY) {
  this.setMiddles(middleX, middleY);
  this.newDistance = this.getDistance(pageX, pageY, middleX, middleY);
  this.difference = this.distance - this.newDistance;
  return this.difference / this.maxDistance;
}

Pinch.prototype.resetDifference = function() {
  this.distance = this.newDistance;
}

Pinch.prototype.setDistance = function(pageX, pageY) {
  this.distance = this.getDistance(pageX, pageY);
}

Pinch.prototype.getDistanceDiff = function(pageX, pageY) {
  return this.distance - this.newDistance;
}

Pinch.prototype.setMiddles = function(middleX, middleY) {
  this.middleX = middleX;
  this.middleY = middleY;
}

var pinching = false,
    currentPinch = undefined;

Hammer($body).on("pinch", function(ev) {
  var middleX = ev.gesture.center.pageX,
      middleY = ev.gesture.center.pageY,
      pageX   = ev.gesture.touches[0].pageX,
      pageY   = ev.gesture.touches[0].pageY;

  if (!pinching) {
    args = {
      middleX: middleX,
      middleY: middleY,
      pageX: pageX,
      pageY: pageY
    };
    currentPinch = new Pinch(args);
    pinching = true;
  }

  var diffMultiplier = currentPinch.getDiffMultiplier(pageX, pageY, middleX, middleY);
  currentPinch.resetDifference();

  canvas.color.changeV(diffMultiplier);
  canvas.color.convertToRgb();
});

// animation handling

Hammer($body).on("touch", function(ev) {
  ev.gesture.preventDefault();
  var animationId = window.requestAnimationFrame(function(){ animate(canvas) });
  animationIds.push(animationId);
});

Hammer($body).on("release", function(ev) {
  for (var i = 0; i < animationIds.length; i++) {
    animationId = animationIds[i];
    window.cancelAnimationFrame(animationId);
  }

  pinching = false;
});

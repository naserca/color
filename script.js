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

Color.prototype.changeV = function() {
  // cool pinch shit
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

var $body, bodyWidth, bodyHeight, middleX, middleY,
    shortestSideLength, longestSideLength, maxRadius,
    $canvas;

$body = document.body;
$canvas = document.getElementById('canvas');
bodyWidth = getComputedStyle($body)['width'].replace(/\D/g, '');
bodyHeight = getComputedStyle($body)['height'].replace(/\D/g, '');
middleX = bodyWidth / 2;
middleY = bodyHeight / 2;

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

var args = {
  elem: $canvas,
  width: bodyWidth,
  height: bodyHeight
};

var canvas = new Canvas(args);
var color  = new Color(canvas);
canvas.color = color;

Hammer($body).on("drag", function(ev) {
  var pageX = ev.gesture.center.pageX,
      pageY = ev.gesture.center.pageY,
      radius = canvas.getRadius(pageX, pageY);

  canvas.color.changeH(pageX, pageY);
  canvas.color.changeS(radius);
  canvas.color.convertToRgb();
});

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
});

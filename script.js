Canvas = (function() {
  function Canvas(elem, width, height) {
    this.elem = elem;
    this.width = width;
    this.height = height;
    this.ctx = this.elem.getContext('2d');
    this.color = "black";
  }

  Canvas.prototype.draw = function() {
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  };

  Canvas.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  return Canvas;

})();

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
  
function getRadius(pageX, pageY) {
  return Math.sqrt(Math.pow(pageX - middleX, 2) + Math.pow(pageY - middleY, 2));
}

function isWithinCircle(radius) {
  return radius <= maxRadius;
}

function getH(pageX, pageY) {
  var referenceX = middleX,
      referenceY = middleY - getRadius(pageX, pageY);

  var degrees = (2 * Math.atan2(pageY - referenceY, pageX - referenceX)) * 180 / Math.PI;
  return degrees / 360;
}

function getS(radius) {
  if (isWithinCircle(radius))
    return radius / maxRadius;
  else
    return 1;
}

function getV() {

}

function HSVtoRGB(hsv) {
  var r, g, b, i, f, p, q, t,
      h = hsv.h,
      s = hsv.s,
      v = hsv.v;

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
  return {
    r: Math.floor(r * 255),
    g: Math.floor(g * 255),
    b: Math.floor(b * 255)
  };
}

function animate(canvas) {
  canvas.draw(canvas.color);

  var animationId = window.requestAnimationFrame(function(){
    animate(canvas)
  });

  animationIds.push(animationId);
}

var animationIds = [];

var canvas = new Canvas($canvas, bodyWidth, bodyHeight);

Hammer($body).on("drag", function(ev) {
  var pageX = ev.gesture.center.pageX,
      pageY = ev.gesture.center.pageY,
      multZ = 1,
      radius = getRadius(pageX, pageY);

  var hsv = {
    h: getH(pageX, pageY),
    s: getS(radius),
    v: multZ
  };

  var rgb = (HSVtoRGB(hsv));
  var color = "rgb("+rgb.r+","+rgb.g+","+rgb.b+")";
  
  canvas.color = color;
});

Hammer($body).on("touch", function(ev) {
  ev.gesture.preventDefault();

  var animationId = window.requestAnimationFrame(function(){
    animate(canvas)
  });

  animationIds.push(animationId);
});

Hammer($body).on("release", function(ev) {
  for (var i = 0; i < animationIds.length; i++) {
    animationId = animationIds[i];
    window.cancelAnimationFrame(animationId);
  }
});

window.savedColors = [];

// canvas

function Canvas(args) {
  this.elem = args.elem;
  this.ctx = this.elem.getContext('2d');
  this.resize();
}

Canvas.prototype.resize = function() {
  this.width = window.innerWidth - this.elem.offsetLeft;
  this.height = window.innerHeight - this.elem.offsetTop;

  this.middleX = this.width / 2 + this.elem.offsetLeft;
  this.middleY = this.height / 2 + this.elem.offsetTop;

  this.isLandscape = (this.width - this.height >= 0);
  this.shortestSideLength = this.isLandscape ? this.height : this.width;
  this.maxRadius = this.shortestSideLength / 2;

  $canvas.style.width = this.width + "px";
  $canvas.style.height = this.height + "px";
  this.ctx = this.elem.getContext('2d');
}

Canvas.prototype.draw = function(prefillColor) {
  var colorToDraw = prefillColor || color;
  this.ctx.fillStyle = colorToDraw.string();
  this.ctx.fillRect(0, 0, this.width, this.height);
};

Canvas.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
}

Canvas.prototype.getRadius = function(pageX, pageY) {
  return Math.sqrt(Math.pow(pageX - this.middleX, 2) + Math.pow(pageY - this.middleY, 2));
}

Canvas.prototype.isWithinCircle = function(radius) {
  return radius <= this.maxRadius;
}

// color

function Color(args) {
  this.hsv = args.hsv || { h: 1, s: 1, v: .75 };
  this.id  = args.id || Math.random();
  this.convertToRgb();
  return this;
}

Color.prototype.changeH = function(pageX, pageY) {
  var referenceX = canvas.middleX,
      referenceY = canvas.middleY - canvas.getRadius(pageX, pageY);
  var degrees = (2 * Math.atan2(pageY - referenceY, pageX - referenceX)) * 180 / Math.PI;
  this.hsv.h = degrees / 360;
}

Color.prototype.changeS = function(radius) {
  this.hsv.s = (canvas.isWithinCircle(radius)) ? radius / canvas.maxRadius : 1;
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

Color.prototype.isNotAlreadySaved = function() {
  var notSaved = true;
  for (i = 0; i < savedColors.length; i++) {
    if (JSON.stringify(savedColors[i].hsv) === JSON.stringify(this.hsv)) return notSaved = false;
  }
  return notSaved;
}

Color.prototype.hexString = function() {
  return "#" + ((1 << 24) + (this.rgb.r << 16) + (this.rgb.g << 8) + this.rgb.b).toString(16).slice(1);
}

Color.prototype.addDiv = function() {
  $canvas.insertAdjacentHTML('beforebegin',
    "<div class='color' data-id='"+this.id+"'\
    style='background-color:"+this.string()+";'>\
    \ <span class='hex'>"+this.hexString()+"</span>\
    \ <span class='x'>&#215;</span>\
    </div>"
  );
}

// pinch

function Pinch(args) {
  this.maxDistance = 200;
  this.distance = this.getDistance(args.pageX, args.pageY, args.middleX, args.middleY);
}

Pinch.prototype.getDistance = function(pageX, pageY, middleX, middleY) {
  return Math.sqrt(Math.pow(pageX - middleX, 2) + Math.pow(pageY - middleY, 2));
}

Pinch.prototype.getDiffMultiplier = function(pageX, pageY, middleX, middleY) {
  this.setNewDistance(pageX, pageY, middleX, middleY);
  this.setDistanceDiff()
  return this.difference / this.maxDistance;
}

Pinch.prototype.resetDifference = function() {
  this.distance = this.newDistance;
}

Pinch.prototype.setNewDistance = function(pageX, pageY, middleX, middleY) {
  this.newDistance = this.getDistance(pageX, pageY, middleX, middleY);
}

Pinch.prototype.setDistanceDiff = function() {
  this.difference = this.distance - this.newDistance;
}

Pinch.prototype.setMiddles = function(middleX, middleY) {
  this.middleX = middleX;
  this.middleY = middleY;
}

// runner

var $body, $canvas;

$body = document.body;
$canvas = document.getElementById('canvas');

function animate(canvas) {
  canvas.draw(color);

  var animationId = window.requestAnimationFrame(function(){
    animate(canvas)
  });

  animationIds.push(animationId);
}

var animationIds = [];

var canvas, color;
canvas = new Canvas({ elem: $canvas });
color  = new Color({});

// load from localStorage
var colorsStrings = localStorage.getItem("colors");
if ((colorsStrings != null) && (colorsStrings.length > 0)) {
  var colors = JSON.parse(colorsStrings);
  if (colors.length > 0) {
    for (var i = 0; i < colors.length; i++) {
      var savedColor = new Color({
        id: colors[i].id,
        hsv: colors[i].hsv,
      });
      savedColor.addDiv();
      savedColors.push(savedColor);
    }
    // hack to clone
    var savedColorString = JSON.stringify(savedColors[savedColors.length - 1]);
    color = new Color({ hsv: JSON.parse(savedColorString).hsv });
    setUpXs();
    canvas.draw();
  }
}

canvas.resize();

var started = (savedColors.length > 0);

Hammer($canvas).on("drag", function(ev) {
  if (!savedColorsFull() || !pinching) {
    var pageX = ev.gesture.center.pageX,
        pageY = ev.gesture.center.pageY,
        radius = canvas.getRadius(pageX, pageY);

    color.changeH(pageX, pageY);
    color.changeS(radius);
    color.convertToRgb();
  }
});

var pinching = false,
    currentPinch = undefined;

Hammer($canvas).on("pinch", function(ev) {
  if (!savedColorsFull()) {
    var middleX = ev.gesture.center.pageX,
        middleY = ev.gesture.center.pageY,
        pageX   = ev.gesture.touches[0].pageX,
        pageY   = ev.gesture.touches[0].pageY;

    if (!pinching) {
      currentPinch = new Pinch({
        middleX: middleX,
        middleY: middleY,
        pageX:   pageX,
        pageY:   pageY
      });
      pinching = true;
    }

    var diffMultiplier = currentPinch.getDiffMultiplier(
      pageX, pageY, middleX, middleY
    );
    color.changeV(diffMultiplier);
    color.convertToRgb();

    currentPinch.resetDifference();
  }
});

function closest(elem, selector) {
  var matchesSelector = elem.matches || elem.webkitMatchesSelector || elem.mozMatchesSelector || elem.msMatchesSelector;

  while (elem) {
    if (matchesSelector.bind(elem)(selector)) {
      return elem;
    } else {
      elem = elem.parentNode;
    }
  }
  return false;
}

Hammer($canvas).on("tap", function(ev) {
  ev.gesture.preventDefault();
  if ((started) && (color.isNotAlreadySaved()) && savedColors.length < 5) {
    color.addDiv();
    canvas.resize();

    // hack to clone
    var savedColorString = JSON.stringify(color);

    // start over with the same color as a starting point
    color = new Color({ hsv: JSON.parse(savedColorString).hsv });

    savedColors.push(JSON.parse(savedColorString));

    localStorage.setItem("colors", JSON.stringify(savedColors));

    setUpXs();
  }
});

// animation handling

Hammer($canvas).on("dragstart", function(ev) {
  ev.gesture.preventDefault();
  if (!savedColorsFull()) {
    var animationId = window.requestAnimationFrame(function(){ animate(canvas) });
    animationIds.push(animationId);
    started = true;
  }
});

Hammer($canvas).on("touch", function(ev) {
  ev.gesture.preventDefault();
  if (!savedColorsFull()) {
    if (started) {
      var animationId = window.requestAnimationFrame(function(){ animate(canvas) });
      animationIds.push(animationId);
    } else {
      if (ev.gesture.touches.length > 1) ev.gesture.stopDetect();
    }
  }
});

Hammer($canvas).on("release", function(ev) {
  for (var i = 0; i < animationIds.length; i++) {
    animationId = animationIds[i];
    window.cancelAnimationFrame(animationId);
  }

  pinching = false;
});

// resize events

window.addEventListener('resize', function() { canvas.resize(); });
window.addEventListener('orientationchange', function() { canvas.resize(); });

// x's

function setUpXs() {
  var $x = document.querySelectorAll('.color .x');

  for (var i = 0; i < $x.length; i++) {
    Hammer($x[i]).on("tap", function(ev) {
      var $colorDiv = (closest(this, '.color'));
      $colorDiv.style.display = 'none';
      var colorId = $colorDiv.getAttribute("data-id");

      for (j = 0; j < savedColors.length; j++) {
        if (JSON.stringify(savedColors[j].id) === colorId) {
          savedColors.splice(j, 1);
          localStorage.setItem("colors", JSON.stringify(savedColors));
        }
      }
      canvas.resize();
    });
  }
}

function savedColorsFull() {
  return (savedColors.length >= 5);
}
window.savedColors = [];
localStorageString = "naserca-colors-v-0-0-1";

function animate(canvas) {
  canvas.draw(color);

  var animationId = window.requestAnimationFrame(function(){
    animate(canvas)
  });

  animationIds.push(animationId);
}

function stopAnimation() {
  for (var i = 0; i < animationIds.length; i++) {
    animationId = animationIds[i];
    window.cancelAnimationFrame(animationId);
  }
}

function savedColorsFull() {
  return (savedColors.length >= 5);
}

function savedColorsEmpty() {
  return (savedColors.length <= 0);
}

function saveToLocalStorage() {
  localStorage.setItem(localStorageString, JSON.stringify(savedColors));
}

function changeUrl() {
  savedColorHexStrings = savedColors.map(function(savedColor) {
    return savedColor.hexString();
  });
  urlString = savedColorHexStrings.join('');
  if (urlString.length > 0)
    return history.replaceState('', '', urlString);
  else
    window.location = urlString;
}

function getHexArrayFromUrl() {
  var url = document.URL;
  return url.match(/(\#.{6})/g);
};

function loadFromUrl(args) {
  var hexArray = args.hexArray,
      color    = args.color,
      canvas   = args.canvas;

  for (var i = 0; i < hexArray.length; i++) {
    hex = hexArray[i];
    colorFromUrl = new Color({ hexString: hex });
    colorFromUrl.saveSelf();
  }
}

function loadFromLocalStorage(args) {
  var color    = args.color,
      canvas   = args.canvas;

  var colorsStrings = localStorage.getItem(localStorageString);
  if ((colorsStrings != null) && (colorsStrings.length > 0)) {
    var colors = JSON.parse(colorsStrings);
    if (colors.length > 0) {
      for (var i = 0; i < colors.length; i++) {
        var savedColor = new Color({
          id: colors[i].id,
          hsv: colors[i].hsv,
        });
        savedColor.saveSelf();
      }
    }
  }
}

function prepareNextColor() {
  // hack to clone
  var savedColorString = JSON.stringify(savedColors[savedColors.length - 1]);
  return new Color({ hsv: JSON.parse(savedColorString).hsv });
}

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

  this.drawWidth = 

  this.isLandscape = (this.width - this.height >= 0);
  this.shortestSideLength = this.isLandscape ? this.height : this.width;
  this.maxRadius = this.shortestSideLength / 2;

  this.elem.style.width = this.width + "px";
  this.elem.style.height = this.height + "px";

  this.ctx = this.elem.getContext('2d');
}

Canvas.prototype.draw = function(prefillColor) {
  var colorToDraw = prefillColor || color;
  this.ctx.fillStyle = colorToDraw.rgbString();
  this.ctx.fillRect(0, 0, 350, 150);
};

Canvas.prototype.clear = function() {
  this.ctx.clearRect(0, 0, 350, 150);
}

Canvas.prototype.getRadius = function(pageX, pageY) {
  return Math.sqrt(Math.pow(pageX - this.middleX, 2) + Math.pow(pageY - this.middleY, 2));
}

Canvas.prototype.isWithinCircle = function(radius) {
  return radius <= this.maxRadius;
}

// color

function Color(args) {
  if (args.hexString === undefined) {
    this.hsv = args.hsv || { h: 1, s: 1, v: .75 };
  } else {
    this.hexToHsv(args.hexString);
  }
  this.id = args.id || Math.random();
  this.hsvToRgb();
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

Color.prototype.rgbString = function() {
  return "rgb("+this.rgb.r+","+this.rgb.g+","+this.rgb.b+")";
}

Color.prototype.hexToRgb = function(hexString) {
  if (hexString === undefined)
    hexString = this.hexString();

  cleanHexString = hexString.slice(1);

  this.rgb = {
    r: parseInt(cleanHexString.substring(0,2), 16),
    g: parseInt(cleanHexString.substring(2,4), 16),
    b: parseInt(cleanHexString.substring(4,6), 16)
  }
  return this.rgb;
}

Color.prototype.hexToHsv = function(hexString) {
  var rgb = this.hexToRgb(hexString);

  var r = rgb.r / 255,
      g = rgb.g / 255,
      b = rgb.b / 255;
 
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, v = max;
 
  var d = max - min;
  s = max == 0 ? 0 : d / max;
 
  if (max == min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
 
  this.hsv = { h: h, s: s, v: v };
  return this.hsv;
}

Color.prototype.hsvToRgb = function() {
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
  return this.rgb;
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

Color.prototype.createDiv = function() {
  $div = document.createElement('div');
  $div.className += 'color';
  $div.setAttribute("data-id", this.id);
  $div.style.backgroundColor = this.rgbString();
  $div.innerHTML = "<span class='hex'>"+this.hexString()+"</span>\
  \                 <span class='x'>&#215;</span>"
  return $div;
}

Color.prototype.setupDeleteHandler = function($div) {
  var $x = $div.querySelector('.x'),
      that = this;

  Hammer($x).on("tap", function(ev) {
    that.deleteSelf($div);
    saveToLocalStorage();
    changeUrl();
  });
}

Color.prototype.addDiv = function() {
  $div = this.createDiv();
  $body.insertBefore($div, $canvas);
  this.setupDeleteHandler($div);
  canvas.resize();
}

Color.prototype.saveSelf = function() {
  this.addDiv();
  this.hexToRgb();
  savedColors.push(this);
  saveToLocalStorage();
  changeUrl();
}

Color.prototype.deleteDiv = function($div) {
  $div.style.display = 'none';
  canvas.resize();
}

Color.prototype.deleteSelf = function($div) {
  this.deleteDiv($div);
  for (i = 0; i < savedColors.length; i++) {
    if (savedColors[i].id === this.id) {
      savedColors.splice(i, 1);
      break;
    }
  }
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

var animationIds = [];

var canvas, color;
canvas = new Canvas({ elem: $canvas });
color  = new Color({});

// load from URL
var hexArray = getHexArrayFromUrl();

if (hexArray !== null) {
  loadFromUrl({
    hexArray: hexArray,
    color: color,
    canvas: canvas
  });
} else {
  loadFromLocalStorage({
    color: color,
    canvas: canvas
  });
}

if (savedColors.length > 0) {
  color = prepareNextColor();
  canvas.draw();
}

canvas.resize();

var timeoutId;
$canvas.onmousewheel = function(ev) {
  ev.preventDefault();

  if (!savedColorsFull()) {
    var animationId = window.requestAnimationFrame(function(){ animate(canvas) });
    animationIds.push(animationId);

    var distanceDiff = -(ev.wheelDeltaY / 3000);
    color.changeV(distanceDiff);
    color.hsvToRgb();

    clearTimeout(timeoutId);
    timeoutId = setTimeout(function() {
      stopAnimation();
    }, 250);
  }
}

var started = (savedColors.length > 0);

var pinching = false,
    currentPinch = undefined;

Hammer($canvas).on("drag", function(ev) {
  if (!savedColorsFull() && !pinching) {
    var pageX = ev.gesture.center.pageX,
        pageY = ev.gesture.center.pageY,
        radius = canvas.getRadius(pageX, pageY);

    color.changeH(pageX, pageY);
    color.changeS(radius);
    color.hsvToRgb();
  }
});

Hammer($canvas).on("pinch", function(ev) {
  ev.gesture.preventDefault();

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

    var diffMultiplier = currentPinch.getDiffMultiplier(pageX, pageY, middleX, middleY);
    color.changeV(diffMultiplier);
    color.hsvToRgb();

    currentPinch.resetDifference();
  }
});

Hammer($canvas).on("tap", function(ev) {
  ev.gesture.preventDefault();
  if ((started) && (color.isNotAlreadySaved()) && (!savedColorsFull())) {
    color.saveSelf();

    // hack to clone
    var savedColorString = JSON.stringify(color);

    // start over with the same color as a starting point
    color = new Color({ hsv: JSON.parse(savedColorString).hsv });
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
  stopAnimation();
  pinching = false;
});

Hammer($body).on("touch", function(ev) {
  ev.gesture.preventDefault();
});

// resize events

window.addEventListener('resize', function() { canvas.resize(); });
window.addEventListener('orientationchange', function() { canvas.resize(); });
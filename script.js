var $body, bodyWidth, bodyHeight, middleX, middleY,
    shortestSideLength, longestSideLength, maxRadius,
    $circle, $main;

$body = document.body,
bodyWidth = getComputedStyle($body)['width'].replace(/\D/g, ''),
bodyHeight = getComputedStyle($body)['height'].replace(/\D/g, ''),
middleX = bodyWidth / 2,
middleY = bodyHeight / 2;

isLandscape = (bodyWidth - bodyHeight >= 0);
shortestSideLength = bodyWidth.isLongest ? bodyHeight : bodyWidth;

maxRadius = shortestSideLength / 2;

$circle = document.getElementById('circle');
$main = document.getElementById('main');

if (isLandscape)
  $circle.style.width = bodyHeight + "px";
else
  topOffset = bodyHeight / 2 - bodyWidth / 2;
  $circle.style.top = topOffset + "px";
  $circle.style.height = bodyWidth + "px";
  

  
function getRadius(pageX, pageY) {
  return Math.sqrt(Math.pow(pageX - middleX, 2) + Math.pow(pageY - middleY, 2));
}

function isWithinCircle(radius) {
  return radius <= maxRadius;
}

var getH = function(pageX, pageY) {
  var referenceX = middleX,
      referenceY = middleY - getRadius(pageX, pageY);

  var degrees = (2 * Math.atan2(pageY - referenceY, pageX - referenceX)) * 180 / Math.PI;
  return degrees / 360;
}

var getS = function(radius) {
  if (isWithinCircle(radius))
    return radius / maxRadius;
  else
    return 1;
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

if (Modernizr.touch) {
} else {
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

    $body.style.backgroundColor = "rgb("+rgb.r+","+rgb.g+","+rgb.b+")";

  });

}
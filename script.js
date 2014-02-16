var $body = document.body,
    bodyWidth = getComputedStyle($body)['width'].replace(/\D/g, ''),
    bodyHeight = getComputedStyle($body)['height'].replace(/\D/g, ''),
    middleX = bodyWidth / 2,
    middleY = bodyHeight / 2,
    maxRadius = middleX;

var getPageMultiplier = function(pagePos, windowLength) {
  return pagePos / windowLength
}

var getH = function(pageX, pageY) {
  var referenceX = middleX,
      referenceY = middleY - Math.sqrt(Math.abs(pageX - middleX) * Math.abs(pageX - middleX) + Math.abs(pageY - middleY) * Math.abs(pageY - middleY));

  var degrees = (2 * Math.atan2(pageY - referenceY, pageX - referenceX)) * 180 / Math.PI;
  return degrees / 360;
}

var getS = function(pageX, pageY) {
  var radius = Math.sqrt(Math.pow(pageX - middleX, 2) + Math.pow(pageY - middleY, 2));
  return radius / maxRadius;
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
        multZ = 1;

    var hsv = {
      h: getH(pageX, pageY),
      s: getS(pageX, pageY),
      v: multZ
    };

    var rgb = (HSVtoRGB(hsv));

    $body.style.backgroundColor = "rgb("+rgb.r+","+rgb.g+","+rgb.b+")";

  });

}
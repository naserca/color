window.closest = function(elem, selector) {
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
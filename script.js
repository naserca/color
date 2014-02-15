var $body = document.querySelectorAll('body')[0];

Hammer($body).on("tap", function(ev) {
  alert('hello!');
});
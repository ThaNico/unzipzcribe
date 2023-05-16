/**
 * The cloth physics code comes from dissimulate's tearable cloth :
 * https://codepen.io/dissimulate/pen/
 * https://github.com/dissimulate/Tearable-Cloth
 *
 * This was made in a few hours for fun, going back and forth with ChatGPT, please don't judge :)
 */

var physics_accuracy = 3,
  mouse_influence = 20,
  mouse_cut = 5,
  gravity = 1000,
  cloth_height = 40,
  cloth_width = 60,
  start_y = 20,
  spacing = 7,
  tear_distance = 60;

window.requestAnimFrame =
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function (callback) {
    window.setTimeout(callback, 1e3 / 60);
  };

var canvas,
  ctx,
  cloth,
  boundsx,
  boundsy,
  timer,
  mouse = {
    down: !1,
    button: 1,
    x: 0,
    y: 0,
    px: 0,
    py: 0,
  };

var rectWidth = 100;
var rectX = window.innerWidth / 2 - rectWidth / 2;
var rectRight = rectWidth + rectX;
var rectY = 120;
var rectHeight = 40;
var rectBottom = rectY + rectHeight;

var Point = function (x, y) {
  (this.x = x),
    (this.y = y),
    (this.px = x),
    (this.py = y),
    (this.vx = 0),
    (this.vy = 0),
    (this.pin_x = null),
    (this.pin_y = null),
    (this.constraints = []);
};

Point.prototype.update = function (delta) {
  if (mouse.down) {
    var diff_x = this.x - mouse.x,
      diff_y = this.y - mouse.y,
      dist = Math.sqrt(diff_x * diff_x + diff_y * diff_y);
    if (1 == mouse.button)
      dist < mouse_influence &&
        ((this.px = this.x - (mouse.x - mouse.px) * 1.8),
        (this.py = this.y - (mouse.y - mouse.py) * 1.8));
    else if (dist < mouse_cut) this.constraints = [];
  }
  this.add_force(0, gravity);
  delta *= delta;
  nx = this.x + (this.x - this.px) * 0.99 + (this.vx / 2) * delta;
  ny = this.y + (this.y - this.py) * 0.99 + (this.vy / 2) * delta;
  (this.px = this.x),
    (this.py = this.y),
    (this.x = nx),
    (this.y = ny),
    (this.vy = this.vx = 0);
};

Point.prototype.draw = function () {
  if (!this.constraints.length) return;
  var i = this.constraints.length;
  while (i--) this.constraints[i].draw();
};

Point.prototype.resolve_constraints = function () {
  if (null != this.pin_x && null != this.pin_y)
    return (this.x = this.pin_x), (this.y = this.pin_y), void 0;
  var i = this.constraints.length;
  while (i--) this.constraints[i].resolve();
  this.x > boundsx
    ? (this.x = 2 * boundsx - this.x)
    : 1 > this.x && (this.x = 2 - this.x),
    this.y < 1
      ? (this.y = 2 - this.y)
      : this.y > boundsy && (this.y = 2 * boundsy - this.y);
};

Point.prototype.attach = function (point) {
  this.constraints.push(new Constraint(this, point));
};

Point.prototype.remove_constraint = function (constraint) {
  this.constraints.splice(this.constraints.indexOf(constraint), 1);
};

Point.prototype.add_force = function (x, y) {
  (this.vx += x), (this.vy += y);
  var round = 400;
  (this.vx = ~~(this.vx * round) / round),
    (this.vy = ~~(this.vy * round) / round);
};

Point.prototype.pin = function (pinx, piny) {
  (this.pin_x = pinx), (this.pin_y = piny);
};

var Constraint = function (p1, p2) {
  (this.p1 = p1), (this.p2 = p2), (this.length = spacing);
};

Constraint.prototype.resolve = function () {
  var diff_x = this.p1.x - this.p2.x,
    diff_y = this.p1.y - this.p2.y,
    dist = Math.sqrt(diff_x * diff_x + diff_y * diff_y),
    diff = (this.length - dist) / dist;
  if (dist > tear_distance) this.p1.remove_constraint(this);
  var px = diff_x * diff * 0.5,
    py = diff_y * diff * 0.5;
  (this.p1.x += px), (this.p1.y += py), (this.p2.x -= px), (this.p2.y -= py);
};

Constraint.prototype.draw = function () {
  ctx.moveTo(this.p1.x, this.p1.y), ctx.lineTo(this.p2.x, this.p2.y);
};

var Cloth = function () {
  this.points = [];

  var start_x = canvas.width / 2 - (cloth_width * spacing) / 2;

  for (var y = 0; y <= cloth_height; y++) {
    for (var x = 0; x <= cloth_width; x++) {
      var p = new Point(start_x + x * spacing, start_y + y * spacing);

      x != 0 && p.attach(this.points[this.points.length - 1]);
      y == 0 && p.pin(p.x, p.y);
      y != 0 && p.attach(this.points[x + (y - 1) * (cloth_width + 1)]);

      this.points.push(p);
    }
  }
};

Cloth.prototype.update = function () {
  var i = physics_accuracy;

  while (i--) {
    var p = this.points.length;
    while (p--) this.points[p].resolve_constraints();
  }

  i = this.points.length;
  while (i--) this.points[i].update(0.016);
};

Cloth.prototype.draw = function () {
  ctx.beginPath();

  drawUnsubBtn();

  var i = cloth.points.length;
  while (i--) cloth.points[i].draw();
  ctx.stroke();
};

const drawUnsubBtn = () => {
  var gradient = ctx.createLinearGradient(
    rectX,
    rectY,
    rectX,
    rectY + rectHeight
  );
  gradient.addColorStop(0, "#0000FF");
  gradient.addColorStop(0.5, "#FFFFFF");
  gradient.addColorStop(1, "#FF0000");

  ctx.fillStyle = gradient;
  ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

  ctx.fillStyle = "black";
  ctx.font = "bold 15px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Unsubscribe", rectX + rectWidth / 2, rectY + rectHeight / 2);
};

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  cloth.update();
  cloth.draw();
  requestAnimFrame(update);
}

function start() {
  canvas.onmousedown = function (e) {
    mouse.button = e.which;
    mouse.px = mouse.x;
    mouse.py = mouse.y;
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.down = true;

    // Check the amount of cloth torn down from the rectangle's position
    var clothTorn = 0;
    for (var i = 0; i < cloth.points.length; i++) {
      var point = cloth.points[i];
      if (
        point.x >= rectX &&
        point.x <= rectRight &&
        point.y >= rectY &&
        point.y <= rectBottom
      ) {
        clothTorn++;
      }
    }

    if (
      mouse.x >= rectX &&
      mouse.x <= rectRight &&
      mouse.y >= rectY &&
      mouse.y <= rectBottom
    ) {
      if (clothTorn > 25) {
        const msgFailElement = document.getElementById("msgfail");
        fadeIn(msgFailElement);

        clearTimeout(timer);
        timer = setTimeout(function () {
          fadeOut(msgFailElement);
        }, 2000);
        return;
      }

      if (confirm("Oh no 😭 We're sad to let you go! Are you sure ??")) {
        document.getElementById("msgok").style.display = "block";
      } else {
        location.reload();
      }
    }

    e.preventDefault();
  };

  canvas.onmouseup = function (e) {
    (mouse.down = !1), e.preventDefault();
  };

  canvas.onmousemove = function (e) {
    (mouse.px = mouse.x), (mouse.py = mouse.y);
    var rect = canvas.getBoundingClientRect();
    (mouse.x = e.clientX - rect.left),
      (mouse.y = e.clientY - rect.top),
      e.preventDefault();
  };

  canvas.oncontextmenu = function (e) {
    e.preventDefault();
  };

  boundsx = canvas.width - 1;
  boundsy = canvas.height - 1;
  ctx.strokeStyle = "#888";
  cloth = new Cloth();
  update();
}
window.onload = function () {
  (canvas = document.getElementById("canvas")),
    (ctx = canvas.getContext("2d")),
    (canvas.width = window.innerWidth),
    (canvas.height = window.innerHeight),
    start();
};

function fadeIn(element) {
  element.style.opacity = 0;
  element.style.display = "block";

  var opacity = 0;
  var timer = setInterval(function () {
    if (opacity >= 1) {
      clearInterval(timer);
    }
    element.style.opacity = opacity;
    opacity += 0.1;
  }, 50);
}

function fadeOut(element) {
  var opacity = 1;
  var timer = setInterval(function () {
    if (opacity <= 0) {
      clearInterval(timer);
      element.style.display = "none";
    }
    element.style.opacity = opacity;
    opacity -= 0.1;
  }, 50);
}

let sqrt;module.link("../math.js",{sqrt(v){sqrt=v}},0);

const sqrt3 = sqrt(3);

module.exportDefault({
  draw(context, size) {
    const y = -sqrt(size / (sqrt3 * 3));
    context.moveTo(0, y * 2);
    context.lineTo(-sqrt3 * y, -y);
    context.lineTo(sqrt3 * y, -y);
    context.closePath();
  }
});

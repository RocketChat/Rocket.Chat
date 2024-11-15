let sqrt;module.link("../math.js",{sqrt(v){sqrt=v}},0);

module.exportDefault({
  draw(context, size) {
    const r = sqrt(size) * 0.4431;
    context.moveTo(r, r);
    context.lineTo(r, -r);
    context.lineTo(-r, -r);
    context.lineTo(-r, r);
    context.closePath();
  }
});

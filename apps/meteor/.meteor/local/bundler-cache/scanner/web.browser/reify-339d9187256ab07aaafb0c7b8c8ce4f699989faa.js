let min,sqrt;module.link("../math.js",{min(v){min=v},sqrt(v){sqrt=v}},0);

module.exportDefault({
  draw(context, size) {
    const r = sqrt(size - min(size / 7, 2)) * 0.87559;
    context.moveTo(-r, 0);
    context.lineTo(r, 0);
    context.moveTo(0, r);
    context.lineTo(0, -r);
  }
});

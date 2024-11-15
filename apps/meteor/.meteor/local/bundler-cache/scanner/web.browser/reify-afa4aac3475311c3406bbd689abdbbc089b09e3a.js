let min,sqrt;module.link("../math.js",{min(v){min=v},sqrt(v){sqrt=v}},0);

module.exportDefault({
  draw(context, size) {
    const r = sqrt(size - min(size / 6, 1.7)) * 0.6189;
    context.moveTo(-r, -r);
    context.lineTo(r, r);
    context.moveTo(-r, r);
    context.lineTo(r, -r);
  }
});

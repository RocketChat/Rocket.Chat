let sqrt;module.link("../math.js",{sqrt(v){sqrt=v}},0);

module.exportDefault({
  draw(context, size) {
    const w = sqrt(size);
    const x = -w / 2;
    context.rect(x, x, w, w);
  }
});

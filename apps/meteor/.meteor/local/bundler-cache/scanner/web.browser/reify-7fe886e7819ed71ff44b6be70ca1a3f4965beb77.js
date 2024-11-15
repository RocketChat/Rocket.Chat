let pi,sqrt,tau;module.link("../math.js",{pi(v){pi=v},sqrt(v){sqrt=v},tau(v){tau=v}},0);

module.exportDefault({
  draw(context, size) {
    const r = sqrt(size / pi);
    context.moveTo(r, 0);
    context.arc(0, 0, r, 0, tau);
  }
});

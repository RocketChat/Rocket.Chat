let pi,tau;module.link("../math.js",{pi(v){pi=v},tau(v){tau=v}},0);

module.exportDefault({
  draw: function(context, size) {
    var r = Math.sqrt(size / pi);
    context.moveTo(r, 0);
    context.arc(0, 0, r, 0, tau);
  }
});

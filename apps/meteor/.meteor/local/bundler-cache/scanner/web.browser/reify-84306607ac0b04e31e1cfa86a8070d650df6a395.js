module.export({link:()=>link,linkHorizontal:()=>linkHorizontal,linkVertical:()=>linkVertical,linkRadial:()=>linkRadial});let slice;module.link("./array.js",{slice(v){slice=v}},0);let constant;module.link("./constant.js",{default(v){constant=v}},1);let bumpX,bumpY,bumpRadial;module.link("./curve/bump.js",{bumpX(v){bumpX=v},bumpY(v){bumpY=v},bumpRadial(v){bumpRadial=v}},2);let withPath;module.link("./path.js",{withPath(v){withPath=v}},3);let pointX,pointY;module.link("./point.js",{x(v){pointX=v},y(v){pointY=v}},4);





function linkSource(d) {
  return d.source;
}

function linkTarget(d) {
  return d.target;
}

function link(curve) {
  let source = linkSource,
      target = linkTarget,
      x = pointX,
      y = pointY,
      context = null,
      output = null,
      path = withPath(link);

  function link() {
    let buffer;
    const argv = slice.call(arguments);
    const s = source.apply(this, argv);
    const t = target.apply(this, argv);
    if (context == null) output = curve(buffer = path());
    output.lineStart();
    argv[0] = s, output.point(+x.apply(this, argv), +y.apply(this, argv));
    argv[0] = t, output.point(+x.apply(this, argv), +y.apply(this, argv));
    output.lineEnd();
    if (buffer) return output = null, buffer + "" || null;
  }

  link.source = function(_) {
    return arguments.length ? (source = _, link) : source;
  };

  link.target = function(_) {
    return arguments.length ? (target = _, link) : target;
  };

  link.x = function(_) {
    return arguments.length ? (x = typeof _ === "function" ? _ : constant(+_), link) : x;
  };

  link.y = function(_) {
    return arguments.length ? (y = typeof _ === "function" ? _ : constant(+_), link) : y;
  };

  link.context = function(_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), link) : context;
  };

  return link;
}

function linkHorizontal() {
  return link(bumpX);
}

function linkVertical() {
  return link(bumpY);
}

function linkRadial() {
  const l = link(bumpRadial);
  l.angle = l.x, delete l.x;
  l.radius = l.y, delete l.y;
  return l;
}

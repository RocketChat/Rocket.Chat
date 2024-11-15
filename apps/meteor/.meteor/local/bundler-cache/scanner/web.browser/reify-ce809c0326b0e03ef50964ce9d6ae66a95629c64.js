module.export({symbols:()=>symbols});let path;module.link("d3-path",{path(v){path=v}},0);let circle;module.link("./symbol/circle",{default(v){circle=v}},1);let cross;module.link("./symbol/cross",{default(v){cross=v}},2);let diamond;module.link("./symbol/diamond",{default(v){diamond=v}},3);let star;module.link("./symbol/star",{default(v){star=v}},4);let square;module.link("./symbol/square",{default(v){square=v}},5);let triangle;module.link("./symbol/triangle",{default(v){triangle=v}},6);let wye;module.link("./symbol/wye",{default(v){wye=v}},7);let constant;module.link("./constant",{default(v){constant=v}},8);









var symbols = [
  circle,
  cross,
  diamond,
  square,
  star,
  triangle,
  wye
];

module.exportDefault(function() {
  var type = constant(circle),
      size = constant(64),
      context = null;

  function symbol() {
    var buffer;
    if (!context) context = buffer = path();
    type.apply(this, arguments).draw(context, +size.apply(this, arguments));
    if (buffer) return context = null, buffer + "" || null;
  }

  symbol.type = function(_) {
    return arguments.length ? (type = typeof _ === "function" ? _ : constant(_), symbol) : type;
  };

  symbol.size = function(_) {
    return arguments.length ? (size = typeof _ === "function" ? _ : constant(+_), symbol) : size;
  };

  symbol.context = function(_) {
    return arguments.length ? (context = _ == null ? null : _, symbol) : context;
  };

  return symbol;
});

module.export({default:()=>Symbol});module.export({symbolsFill:()=>symbolsFill,symbolsStroke:()=>symbolsStroke},true);let constant;module.link("./constant.js",{default(v){constant=v}},0);let withPath;module.link("./path.js",{withPath(v){withPath=v}},1);let asterisk;module.link("./symbol/asterisk.js",{default(v){asterisk=v}},2);let circle;module.link("./symbol/circle.js",{default(v){circle=v}},3);let cross;module.link("./symbol/cross.js",{default(v){cross=v}},4);let diamond;module.link("./symbol/diamond.js",{default(v){diamond=v}},5);let diamond2;module.link("./symbol/diamond2.js",{default(v){diamond2=v}},6);let plus;module.link("./symbol/plus.js",{default(v){plus=v}},7);let square;module.link("./symbol/square.js",{default(v){square=v}},8);let square2;module.link("./symbol/square2.js",{default(v){square2=v}},9);let star;module.link("./symbol/star.js",{default(v){star=v}},10);let triangle;module.link("./symbol/triangle.js",{default(v){triangle=v}},11);let triangle2;module.link("./symbol/triangle2.js",{default(v){triangle2=v}},12);let wye;module.link("./symbol/wye.js",{default(v){wye=v}},13);let times;module.link("./symbol/times.js",{default(v){times=v}},14);















// These symbols are designed to be filled.
const symbolsFill = [
  circle,
  cross,
  diamond,
  square,
  star,
  triangle,
  wye
];

// These symbols are designed to be stroked (with a width of 1.5px and round caps).
const symbolsStroke = [
  circle,
  plus,
  times,
  triangle2,
  asterisk,
  square2,
  diamond2
];

function Symbol(type, size) {
  let context = null,
      path = withPath(symbol);

  type = typeof type === "function" ? type : constant(type || circle);
  size = typeof size === "function" ? size : constant(size === undefined ? 64 : +size);

  function symbol() {
    let buffer;
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
}

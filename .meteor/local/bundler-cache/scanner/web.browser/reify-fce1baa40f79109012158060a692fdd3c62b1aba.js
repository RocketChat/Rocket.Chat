let color;module.link("d3-color",{color(v){color=v}},0);let rgb;module.link("./rgb.js",{default(v){rgb=v}},1);let genericArray;module.link("./array.js",{genericArray(v){genericArray=v}},2);let date;module.link("./date.js",{default(v){date=v}},3);let number;module.link("./number.js",{default(v){number=v}},4);let object;module.link("./object.js",{default(v){object=v}},5);let string;module.link("./string.js",{default(v){string=v}},6);let constant;module.link("./constant.js",{default(v){constant=v}},7);let numberArray,isNumberArray;module.link("./numberArray.js",{default(v){numberArray=v},isNumberArray(v){isNumberArray=v}},8);









module.exportDefault(function(a, b) {
  var t = typeof b, c;
  return b == null || t === "boolean" ? constant(b)
      : (t === "number" ? number
      : t === "string" ? ((c = color(b)) ? (b = c, rgb) : string)
      : b instanceof color ? rgb
      : b instanceof Date ? date
      : isNumberArray(b) ? numberArray
      : Array.isArray(b) ? genericArray
      : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
      : number)(a, b);
});

var color;module.link("d3-color",{color:function(v){color=v}},0);var rgb;module.link("./rgb.js",{default:function(v){rgb=v}},1);var genericArray;module.link("./array.js",{genericArray:function(v){genericArray=v}},2);var date;module.link("./date.js",{default:function(v){date=v}},3);var number;module.link("./number.js",{default:function(v){number=v}},4);var object;module.link("./object.js",{default:function(v){object=v}},5);var string;module.link("./string.js",{default:function(v){string=v}},6);var constant;module.link("./constant.js",{default:function(v){constant=v}},7);var numberArray,isNumberArray;module.link("./numberArray.js",{default:function(v){numberArray=v},isNumberArray:function(v){isNumberArray=v}},8);









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

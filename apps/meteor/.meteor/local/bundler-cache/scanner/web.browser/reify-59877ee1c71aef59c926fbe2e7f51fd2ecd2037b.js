module.export({default:()=>zip});let transpose;module.link("./transpose.js",{default(v){transpose=v}},0);

function zip() {
  return transpose(arguments);
}

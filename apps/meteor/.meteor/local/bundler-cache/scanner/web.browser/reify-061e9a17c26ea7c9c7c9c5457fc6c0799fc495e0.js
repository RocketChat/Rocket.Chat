module.export({default:()=>shuffle});let sample;module.link('./sample.js',{default(v){sample=v}},0);

// Shuffle a collection.
function shuffle(obj) {
  return sample(obj, Infinity);
}

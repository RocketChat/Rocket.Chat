module.export({default:()=>scan});let leastIndex;module.link("./leastIndex.js",{default(v){leastIndex=v}},0);

function scan(values, compare) {
  const index = leastIndex(values, compare);
  return index < 0 ? undefined : index;
}

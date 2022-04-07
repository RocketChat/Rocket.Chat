module.export({default:()=>contains});let isArrayLike;module.link('./_isArrayLike.js',{default(v){isArrayLike=v}},0);let values;module.link('./values.js',{default(v){values=v}},1);let indexOf;module.link('./indexOf.js',{default(v){indexOf=v}},2);



// Determine if the array or object contains a given item (using `===`).
function contains(obj, item, fromIndex, guard) {
  if (!isArrayLike(obj)) obj = values(obj);
  if (typeof fromIndex != 'number' || guard) fromIndex = 0;
  return indexOf(obj, item, fromIndex) >= 0;
}

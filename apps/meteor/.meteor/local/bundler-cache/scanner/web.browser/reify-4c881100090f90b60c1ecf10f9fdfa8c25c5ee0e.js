module.export({slice:()=>slice});var slice = Array.prototype.slice;

module.exportDefault(function(x) {
  return typeof x === "object" && "length" in x
    ? x // Array, TypedArray, NodeList, array-like
    : Array.from(x); // Map, Set, iterable, string, or anything else
});

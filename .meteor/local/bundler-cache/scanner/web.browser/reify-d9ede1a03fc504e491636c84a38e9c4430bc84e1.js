let sortedIndex;module.link('./sortedIndex.js',{default(v){sortedIndex=v}},0);let findIndex;module.link('./findIndex.js',{default(v){findIndex=v}},1);let createIndexFinder;module.link('./_createIndexFinder.js',{default(v){createIndexFinder=v}},2);



// Return the position of the first occurrence of an item in an array,
// or -1 if the item is not included in the array.
// If the array is large and already in sort order, pass `true`
// for **isSorted** to use binary search.
module.exportDefault(createIndexFinder(1, findIndex, sortedIndex));

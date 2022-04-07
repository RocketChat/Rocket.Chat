module.export({hasStringTagBug:()=>hasStringTagBug,isIE11:()=>isIE11});let supportsDataView;module.link('./_setup.js',{supportsDataView(v){supportsDataView=v}},0);let hasObjectTag;module.link('./_hasObjectTag.js',{default(v){hasObjectTag=v}},1);


// In IE 10 - Edge 13, `DataView` has string tag `'[object Object]'`.
// In IE 11, the most common among them, this problem also applies to
// `Map`, `WeakMap` and `Set`.
var hasStringTagBug = (
      supportsDataView && hasObjectTag(new DataView(new ArrayBuffer(8)))
    ),
    isIE11 = (typeof Map !== 'undefined' && hasObjectTag(new Map));

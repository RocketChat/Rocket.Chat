module.export({cssSupports:()=>cssSupports});let memoize;module.link('@rocket.chat/memo',{memoize(v){memoize=v}},0);
var cssSupports = typeof window !== 'undefined' &&
    typeof window.CSS !== 'undefined' &&
    window.CSS.supports
    ? memoize(function (value) { return window.CSS.supports(value); })
    : function () { return false; };
//# sourceMappingURL=index.js.map
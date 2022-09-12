let _;module.link('./underscore.js',{default(v){_=v}},0);

// By default, Underscore uses ERB-style template delimiters. Change the
// following template settings to use alternative delimiters.
module.exportDefault(_.templateSettings = {
  evaluate: /<%([\s\S]+?)%>/g,
  interpolate: /<%=([\s\S]+?)%>/g,
  escape: /<%-([\s\S]+?)%>/g
});

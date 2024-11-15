module.export({getSupport:function(){return getSupport}});var getWindow,getDocument;module.link('ssr-window',{getWindow:function(v){getWindow=v},getDocument:function(v){getDocument=v}},0);
let support;
function calcSupport() {
  const window = getWindow();
  const document = getDocument();
  return {
    smoothScroll: document.documentElement && document.documentElement.style && 'scrollBehavior' in document.documentElement.style,
    touch: !!('ontouchstart' in window || window.DocumentTouch && document instanceof window.DocumentTouch)
  };
}
function getSupport() {
  if (!support) {
    support = calcSupport();
  }
  return support;
}

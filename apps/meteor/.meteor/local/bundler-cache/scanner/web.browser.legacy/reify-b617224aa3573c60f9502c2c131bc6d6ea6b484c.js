module.export({default:function(){return effectTarget}});var getSlideTransformEl;module.link('./utils.js',{getSlideTransformEl:function(v){getSlideTransformEl=v}},0);
function effectTarget(effectParams, slideEl) {
  const transformEl = getSlideTransformEl(slideEl);
  if (transformEl !== slideEl) {
    transformEl.style.backfaceVisibility = 'hidden';
    transformEl.style['-webkit-backface-visibility'] = 'hidden';
  }
  return transformEl;
}
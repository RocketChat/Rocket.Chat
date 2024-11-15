module.export({default:()=>effectTarget});let getSlideTransformEl;module.link('./utils.js',{getSlideTransformEl(v){getSlideTransformEl=v}},0);
function effectTarget(effectParams, slideEl) {
  const transformEl = getSlideTransformEl(slideEl);
  if (transformEl !== slideEl) {
    transformEl.style.backfaceVisibility = 'hidden';
    transformEl.style['-webkit-backface-visibility'] = 'hidden';
  }
  return transformEl;
}
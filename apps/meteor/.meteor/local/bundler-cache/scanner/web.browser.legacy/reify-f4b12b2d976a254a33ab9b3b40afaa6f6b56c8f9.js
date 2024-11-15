module.export({default:function(){return createShadow}});var createElement,getSlideTransformEl;module.link('./utils.js',{createElement:function(v){createElement=v},getSlideTransformEl:function(v){getSlideTransformEl=v}},0);
function createShadow(params, slideEl, side) {
  const shadowClass = `swiper-slide-shadow${side ? `-${side}` : ''}`;
  const shadowContainer = getSlideTransformEl(slideEl);
  let shadowEl = shadowContainer.querySelector(`.${shadowClass}`);
  if (!shadowEl) {
    shadowEl = createElement('div', `swiper-slide-shadow${side ? `-${side}` : ''}`);
    shadowContainer.append(shadowEl);
  }
  return shadowEl;
}
module.export({default:function(){return transitionEnd}});var transitionEmit;module.link('./transitionEmit.js',{default:function(v){transitionEmit=v}},0);
function transitionEnd(runCallbacks = true, direction) {
  const swiper = this;
  const {
    params
  } = swiper;
  swiper.animating = false;
  if (params.cssMode) return;
  swiper.setTransition(0);
  transitionEmit({
    swiper,
    runCallbacks,
    direction,
    step: 'End'
  });
}
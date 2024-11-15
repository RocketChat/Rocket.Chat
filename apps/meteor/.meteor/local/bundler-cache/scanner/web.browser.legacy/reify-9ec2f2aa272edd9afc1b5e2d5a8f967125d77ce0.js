module.export({default:function(){return transitionStart}});var transitionEmit;module.link('./transitionEmit.js',{default:function(v){transitionEmit=v}},0);
function transitionStart(runCallbacks = true, direction) {
  const swiper = this;
  const {
    params
  } = swiper;
  if (params.cssMode) return;
  if (params.autoHeight) {
    swiper.updateAutoHeight();
  }
  transitionEmit({
    swiper,
    runCallbacks,
    direction,
    step: 'Start'
  });
}
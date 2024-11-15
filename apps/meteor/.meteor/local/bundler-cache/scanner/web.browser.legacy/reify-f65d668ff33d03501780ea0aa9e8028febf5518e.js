module.export({default:function(){return onLoad}});var processLazyPreloader;module.link('../../shared/process-lazy-preloader.js',{processLazyPreloader:function(v){processLazyPreloader=v}},0);
function onLoad(e) {
  const swiper = this;
  processLazyPreloader(swiper, e.target);
  if (swiper.params.cssMode || swiper.params.slidesPerView !== 'auto' && !swiper.params.autoHeight) {
    return;
  }
  swiper.update();
}
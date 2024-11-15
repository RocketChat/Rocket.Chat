module.export({default:()=>onLoad});let processLazyPreloader;module.link('../../shared/process-lazy-preloader.js',{processLazyPreloader(v){processLazyPreloader=v}},0);
function onLoad(e) {
  const swiper = this;
  processLazyPreloader(swiper, e.target);
  if (swiper.params.cssMode || swiper.params.slidesPerView !== 'auto' && !swiper.params.autoHeight) {
    return;
  }
  swiper.update();
}
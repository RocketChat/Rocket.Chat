module.export({default:()=>Manipulation});let appendSlide;module.link('./methods/appendSlide.js',{default(v){appendSlide=v}},0);let prependSlide;module.link('./methods/prependSlide.js',{default(v){prependSlide=v}},1);let addSlide;module.link('./methods/addSlide.js',{default(v){addSlide=v}},2);let removeSlide;module.link('./methods/removeSlide.js',{default(v){removeSlide=v}},3);let removeAllSlides;module.link('./methods/removeAllSlides.js',{default(v){removeAllSlides=v}},4);




function Manipulation({
  swiper
}) {
  Object.assign(swiper, {
    appendSlide: appendSlide.bind(swiper),
    prependSlide: prependSlide.bind(swiper),
    addSlide: addSlide.bind(swiper),
    removeSlide: removeSlide.bind(swiper),
    removeAllSlides: removeAllSlides.bind(swiper)
  });
}
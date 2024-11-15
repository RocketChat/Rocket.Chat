module.export({default:function(){return Manipulation}});var appendSlide;module.link('./methods/appendSlide.js',{default:function(v){appendSlide=v}},0);var prependSlide;module.link('./methods/prependSlide.js',{default:function(v){prependSlide=v}},1);var addSlide;module.link('./methods/addSlide.js',{default:function(v){addSlide=v}},2);var removeSlide;module.link('./methods/removeSlide.js',{default:function(v){removeSlide=v}},3);var removeAllSlides;module.link('./methods/removeAllSlides.js',{default:function(v){removeAllSlides=v}},4);




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
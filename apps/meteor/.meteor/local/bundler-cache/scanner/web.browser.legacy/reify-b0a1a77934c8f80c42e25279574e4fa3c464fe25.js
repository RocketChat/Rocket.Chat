module.export({SwiperSlideContext:function(){return SwiperSlideContext},useSwiperSlide:function(){return useSwiperSlide},SwiperContext:function(){return SwiperContext},useSwiper:function(){return useSwiper}},true);var createContext,useContext;module.link('react',{createContext:function(v){createContext=v},useContext:function(v){useContext=v}},0);
const SwiperSlideContext = /*#__PURE__*/createContext(null);
const useSwiperSlide = () => {
  return useContext(SwiperSlideContext);
};
const SwiperContext = /*#__PURE__*/createContext(null);
const useSwiper = () => {
  return useContext(SwiperContext);
};
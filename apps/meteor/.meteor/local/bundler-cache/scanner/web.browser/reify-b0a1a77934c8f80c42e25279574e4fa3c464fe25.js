module.export({SwiperSlideContext:()=>SwiperSlideContext,useSwiperSlide:()=>useSwiperSlide,SwiperContext:()=>SwiperContext,useSwiper:()=>useSwiper},true);let createContext,useContext;module.link('react',{createContext(v){createContext=v},useContext(v){useContext=v}},0);
const SwiperSlideContext = /*#__PURE__*/createContext(null);
const useSwiperSlide = () => {
  return useContext(SwiperSlideContext);
};
const SwiperContext = /*#__PURE__*/createContext(null);
const useSwiper = () => {
  return useContext(SwiperContext);
};
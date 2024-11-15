module.export({SwiperSlide:()=>SwiperSlide});let React,useRef,useState,forwardRef;module.link('react',{default(v){React=v},useRef(v){useRef=v},useState(v){useState=v},forwardRef(v){forwardRef=v}},0);let uniqueClasses;module.link('../components-shared/utils.js',{uniqueClasses(v){uniqueClasses=v}},1);let useIsomorphicLayoutEffect;module.link('./use-isomorphic-layout-effect.js',{useIsomorphicLayoutEffect(v){useIsomorphicLayoutEffect=v}},2);let SwiperSlideContext;module.link('./context.js',{SwiperSlideContext(v){SwiperSlideContext=v}},3);function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }




const SwiperSlide = /*#__PURE__*/forwardRef(function (_temp, externalRef) {
  let {
    tag: Tag = 'div',
    children,
    className = '',
    swiper,
    zoom,
    lazy,
    virtualIndex,
    swiperSlideIndex,
    ...rest
  } = _temp === void 0 ? {} : _temp;
  const slideElRef = useRef(null);
  const [slideClasses, setSlideClasses] = useState('swiper-slide');
  const [lazyLoaded, setLazyLoaded] = useState(false);
  function updateClasses(_s, el, classNames) {
    if (el === slideElRef.current) {
      setSlideClasses(classNames);
    }
  }
  useIsomorphicLayoutEffect(() => {
    if (typeof swiperSlideIndex !== 'undefined') {
      slideElRef.current.swiperSlideIndex = swiperSlideIndex;
    }
    if (externalRef) {
      externalRef.current = slideElRef.current;
    }
    if (!slideElRef.current || !swiper) {
      return;
    }
    if (swiper.destroyed) {
      if (slideClasses !== 'swiper-slide') {
        setSlideClasses('swiper-slide');
      }
      return;
    }
    swiper.on('_slideClass', updateClasses);
    // eslint-disable-next-line
    return () => {
      if (!swiper) return;
      swiper.off('_slideClass', updateClasses);
    };
  });
  useIsomorphicLayoutEffect(() => {
    if (swiper && slideElRef.current && !swiper.destroyed) {
      setSlideClasses(swiper.getSlideClasses(slideElRef.current));
    }
  }, [swiper]);
  const slideData = {
    isActive: slideClasses.indexOf('swiper-slide-active') >= 0,
    isVisible: slideClasses.indexOf('swiper-slide-visible') >= 0,
    isPrev: slideClasses.indexOf('swiper-slide-prev') >= 0,
    isNext: slideClasses.indexOf('swiper-slide-next') >= 0
  };
  const renderChildren = () => {
    return typeof children === 'function' ? children(slideData) : children;
  };
  const onLoad = () => {
    setLazyLoaded(true);
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({
    ref: slideElRef,
    className: uniqueClasses(`${slideClasses}${className ? ` ${className}` : ''}`),
    "data-swiper-slide-index": virtualIndex,
    onLoad: onLoad
  }, rest), zoom && /*#__PURE__*/React.createElement(SwiperSlideContext.Provider, {
    value: slideData
  }, /*#__PURE__*/React.createElement("div", {
    className: "swiper-zoom-container",
    "data-swiper-zoom": typeof zoom === 'number' ? zoom : undefined
  }, renderChildren(), lazy && !lazyLoaded && /*#__PURE__*/React.createElement("div", {
    className: "swiper-lazy-preloader"
  }))), !zoom && /*#__PURE__*/React.createElement(SwiperSlideContext.Provider, {
    value: slideData
  }, renderChildren(), lazy && !lazyLoaded && /*#__PURE__*/React.createElement("div", {
    className: "swiper-lazy-preloader"
  })));
});
SwiperSlide.displayName = 'SwiperSlide';

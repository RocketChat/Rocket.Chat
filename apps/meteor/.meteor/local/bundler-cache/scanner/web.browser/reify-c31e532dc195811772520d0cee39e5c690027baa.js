module.export({withSSR:()=>withSSR});let createElement;module.link('react',{createElement(v){createElement=v}},0);let useSSR;module.link('./useSSR.js',{useSSR(v){useSSR=v}},1);let composeInitialProps;module.link('./context.js',{composeInitialProps(v){composeInitialProps=v}},2);let getDisplayName;module.link('./utils.js',{getDisplayName(v){getDisplayName=v}},3);



function withSSR() {
  return function Extend(WrappedComponent) {
    function I18nextWithSSR(_ref) {
      let {
        initialI18nStore,
        initialLanguage,
        ...rest
      } = _ref;
      useSSR(initialI18nStore, initialLanguage);
      return createElement(WrappedComponent, {
        ...rest
      });
    }
    I18nextWithSSR.getInitialProps = composeInitialProps(WrappedComponent);
    I18nextWithSSR.displayName = `withI18nextSSR(${getDisplayName(WrappedComponent)})`;
    I18nextWithSSR.WrappedComponent = WrappedComponent;
    return I18nextWithSSR;
  };
}
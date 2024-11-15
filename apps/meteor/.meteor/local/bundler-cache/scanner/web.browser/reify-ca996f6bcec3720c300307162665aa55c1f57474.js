module.export({withTranslation:()=>withTranslation});let createElement,forwardRefReact;module.link('react',{createElement(v){createElement=v},forwardRef(v){forwardRefReact=v}},0);let useTranslation;module.link('./useTranslation.js',{useTranslation(v){useTranslation=v}},1);let getDisplayName;module.link('./utils.js',{getDisplayName(v){getDisplayName=v}},2);


function withTranslation(ns) {
  let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return function Extend(WrappedComponent) {
    function I18nextWithTranslation(_ref) {
      let {
        forwardedRef,
        ...rest
      } = _ref;
      const [t, i18n, ready] = useTranslation(ns, {
        ...rest,
        keyPrefix: options.keyPrefix
      });
      const passDownProps = {
        ...rest,
        t,
        i18n,
        tReady: ready
      };
      if (options.withRef && forwardedRef) {
        passDownProps.ref = forwardedRef;
      } else if (!options.withRef && forwardedRef) {
        passDownProps.forwardedRef = forwardedRef;
      }
      return createElement(WrappedComponent, passDownProps);
    }
    I18nextWithTranslation.displayName = `withI18nextTranslation(${getDisplayName(WrappedComponent)})`;
    I18nextWithTranslation.WrappedComponent = WrappedComponent;
    const forwardRef = (props, ref) => createElement(I18nextWithTranslation, Object.assign({}, props, {
      forwardedRef: ref
    }));
    return options.withRef ? forwardRefReact(forwardRef) : I18nextWithTranslation;
  };
}
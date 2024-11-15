module.export({I18nextProvider:()=>I18nextProvider});let createElement,useMemo;module.link('react',{createElement(v){createElement=v},useMemo(v){useMemo=v}},0);let I18nContext;module.link('./context.js',{I18nContext(v){I18nContext=v}},1);

function I18nextProvider(_ref) {
  let {
    i18n,
    defaultNS,
    children
  } = _ref;
  const value = useMemo(() => ({
    i18n,
    defaultNS
  }), [i18n, defaultNS]);
  return createElement(I18nContext.Provider, {
    value
  }, children);
}
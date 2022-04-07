module.export({I18nextProvider:()=>I18nextProvider});let createElement,useMemo;module.link('react',{createElement(v){createElement=v},useMemo(v){useMemo=v}},0);let I18nContext;module.link('./context',{I18nContext(v){I18nContext=v}},1);

function I18nextProvider(_ref) {
  var i18n = _ref.i18n,
      defaultNS = _ref.defaultNS,
      children = _ref.children;
  var value = useMemo(function () {
    return {
      i18n: i18n,
      defaultNS: defaultNS
    };
  }, [i18n, defaultNS]);
  return createElement(I18nContext.Provider, {
    value: value
  }, children);
}
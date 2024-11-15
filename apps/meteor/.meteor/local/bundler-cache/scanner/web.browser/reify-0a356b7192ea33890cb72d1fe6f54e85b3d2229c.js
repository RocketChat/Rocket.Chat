module.export({nodesToString:()=>nodesToString,Trans:()=>Trans});let useContext;module.link('react',{useContext(v){useContext=v}},0);let nodesToString,TransWithoutContext;module.link('./TransWithoutContext.js',{nodesToString(v){nodesToString=v},Trans(v){TransWithoutContext=v}},1);let getI18n,I18nContext;module.link('./context.js',{getI18n(v){getI18n=v},I18nContext(v){I18nContext=v}},2);



function Trans(_ref) {
  let {
    children,
    count,
    parent,
    i18nKey,
    context,
    tOptions = {},
    values,
    defaults,
    components,
    ns,
    i18n: i18nFromProps,
    t: tFromProps,
    shouldUnescape,
    ...additionalProps
  } = _ref;
  const {
    i18n: i18nFromContext,
    defaultNS: defaultNSFromContext
  } = useContext(I18nContext) || {};
  const i18n = i18nFromProps || i18nFromContext || getI18n();
  const t = tFromProps || i18n && i18n.t.bind(i18n);
  return TransWithoutContext({
    children,
    count,
    parent,
    i18nKey,
    context,
    tOptions,
    values,
    defaults,
    components,
    ns: ns || t && t.ns || defaultNSFromContext || i18n && i18n.options && i18n.options.defaultNS,
    i18n,
    t: tFromProps,
    shouldUnescape,
    ...additionalProps
  });
}
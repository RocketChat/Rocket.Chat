module.export({Translation:()=>Translation});let useTranslation;module.link('./useTranslation.js',{useTranslation(v){useTranslation=v}},0);
function Translation(props) {
  const {
    ns,
    children,
    ...options
  } = props;
  const [t, i18n, ready] = useTranslation(ns, options);
  return children(t, {
    i18n,
    lng: i18n.language
  }, ready);
}
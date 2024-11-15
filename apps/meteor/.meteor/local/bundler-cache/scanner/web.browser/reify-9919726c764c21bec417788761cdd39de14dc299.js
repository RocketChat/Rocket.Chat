module.export({setI18n:()=>setI18n,getI18n:()=>getI18n});let i18nInstance;
function setI18n(instance) {
  i18nInstance = instance;
}
function getI18n() {
  return i18nInstance;
}
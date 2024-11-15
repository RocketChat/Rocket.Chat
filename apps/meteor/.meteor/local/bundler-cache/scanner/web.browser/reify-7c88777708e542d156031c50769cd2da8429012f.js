module.export({getDefaults:()=>getDefaults,setDefaults:()=>setDefaults,getI18n:()=>getI18n,setI18n:()=>setI18n,initReactI18next:()=>initReactI18next,ReportNamespaces:()=>ReportNamespaces,composeInitialProps:()=>composeInitialProps,getInitialProps:()=>getInitialProps});module.export({I18nContext:()=>I18nContext},true);let createContext;module.link('react',{createContext(v){createContext=v}},0);let getDefaults,setDefaults;module.link('./defaults.js',{getDefaults(v){getDefaults=v},setDefaults(v){setDefaults=v}},1);let getI18n,setI18n;module.link('./i18nInstance.js',{getI18n(v){getI18n=v},setI18n(v){setI18n=v}},2);let initReactI18next;module.link('./initReactI18next.js',{initReactI18next(v){initReactI18next=v}},3);




const I18nContext = createContext();
class ReportNamespaces {
  constructor() {
    this.usedNamespaces = {};
  }
  addUsedNamespaces(namespaces) {
    namespaces.forEach(ns => {
      if (!this.usedNamespaces[ns]) this.usedNamespaces[ns] = true;
    });
  }
  getUsedNamespaces() {
    return Object.keys(this.usedNamespaces);
  }
}
function composeInitialProps(ForComponent) {
  return ctx => new Promise(resolve => {
    const i18nInitialProps = getInitialProps();
    if (ForComponent.getInitialProps) {
      ForComponent.getInitialProps(ctx).then(componentsInitialProps => {
        resolve({
          ...componentsInitialProps,
          ...i18nInitialProps
        });
      });
    } else {
      resolve(i18nInitialProps);
    }
  });
}
function getInitialProps() {
  const i18n = getI18n();
  const namespaces = i18n.reportNamespaces ? i18n.reportNamespaces.getUsedNamespaces() : [];
  const ret = {};
  const initialI18nStore = {};
  i18n.languages.forEach(l => {
    initialI18nStore[l] = {};
    namespaces.forEach(ns => {
      initialI18nStore[l][ns] = i18n.getResourceBundle(l, ns) || {};
    });
  });
  ret.initialI18nStore = initialI18nStore;
  ret.initialLanguage = i18n.language;
  return ret;
}
module.export({initReactI18next:()=>initReactI18next},true);let setDefaults;module.link('./defaults.js',{setDefaults(v){setDefaults=v}},0);let setI18n;module.link('./i18nInstance.js',{setI18n(v){setI18n=v}},1);

const initReactI18next = {
  type: '3rdParty',
  init(instance) {
    setDefaults(instance.options.react);
    setI18n(instance);
  }
};
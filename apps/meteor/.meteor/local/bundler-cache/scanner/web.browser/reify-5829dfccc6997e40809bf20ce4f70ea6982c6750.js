module.export({setDefaults:()=>setDefaults,getDefaults:()=>getDefaults});let unescape;module.link('./unescape.js',{unescape(v){unescape=v}},0);
let defaultOptions = {
  bindI18n: 'languageChanged',
  bindI18nStore: '',
  transEmptyNodeValue: '',
  transSupportBasicHtmlNodes: true,
  transWrapTextNodes: '',
  transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
  useSuspense: true,
  unescape
};
function setDefaults() {
  let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  defaultOptions = {
    ...defaultOptions,
    ...options
  };
}
function getDefaults() {
  return defaultOptions;
}
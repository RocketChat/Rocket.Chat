module.export({Translation:()=>Translation});let _slicedToArray;module.link("@babel/runtime/helpers/slicedToArray",{default(v){_slicedToArray=v}},0);let _objectWithoutProperties;module.link("@babel/runtime/helpers/objectWithoutProperties",{default(v){_objectWithoutProperties=v}},1);let useTranslation;module.link('./useTranslation',{useTranslation(v){useTranslation=v}},2);

var _excluded = ["ns", "children"];

function Translation(props) {
  var ns = props.ns,
      children = props.children,
      options = _objectWithoutProperties(props, _excluded);

  var _useTranslation = useTranslation(ns, options),
      _useTranslation2 = _slicedToArray(_useTranslation, 3),
      t = _useTranslation2[0],
      i18n = _useTranslation2[1],
      ready = _useTranslation2[2];

  return children(t, {
    i18n: i18n,
    lng: i18n.language
  }, ready);
}
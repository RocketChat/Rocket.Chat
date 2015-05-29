// see http://stackoverflow.com/questions/8051975/access-object-child-properties-using-a-dot-notation-string
getDescendantProp = function (obj, desc) {
  var arr = desc.split(".");
  while(arr.length && (obj = obj[arr.shift()]));
  return obj;
};
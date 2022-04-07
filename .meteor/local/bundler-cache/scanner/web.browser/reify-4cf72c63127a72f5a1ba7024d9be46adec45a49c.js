module.exports = function(ctor, superStr) {
  var result = false;
  var mixinCtors = ctor.mixinCtors_;
  if (mixinCtors) {
    for (var i = 0; i < mixinCtors.length; i++) {
      result = mixinCtors[i].name === superStr;
      if (result) break;
    }
  }

  return result;
}



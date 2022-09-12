module.export({symlogish:()=>symlogish,default:()=>symlog});let linearish;module.link("./linear.js",{linearish(v){linearish=v}},0);let copy,transformer;module.link("./continuous.js",{copy(v){copy=v},transformer(v){transformer=v}},1);let initRange;module.link("./init.js",{initRange(v){initRange=v}},2);



function transformSymlog(c) {
  return function(x) {
    return Math.sign(x) * Math.log1p(Math.abs(x / c));
  };
}

function transformSymexp(c) {
  return function(x) {
    return Math.sign(x) * Math.expm1(Math.abs(x)) * c;
  };
}

function symlogish(transform) {
  var c = 1, scale = transform(transformSymlog(c), transformSymexp(c));

  scale.constant = function(_) {
    return arguments.length ? transform(transformSymlog(c = +_), transformSymexp(c)) : c;
  };

  return linearish(scale);
}

function symlog() {
  var scale = symlogish(transformer());

  scale.copy = function() {
    return copy(scale, symlog()).constant(scale.constant());
  };

  return initRange.apply(scale, arguments);
}

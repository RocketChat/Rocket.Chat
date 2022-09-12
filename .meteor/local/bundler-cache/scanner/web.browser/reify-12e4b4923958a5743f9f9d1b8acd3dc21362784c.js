module.export({default:()=>identity});let linearish;module.link("./linear.js",{linearish(v){linearish=v}},0);let number;module.link("./number.js",{default(v){number=v}},1);


function identity(domain) {
  var unknown;

  function scale(x) {
    return x == null || isNaN(x = +x) ? unknown : x;
  }

  scale.invert = scale;

  scale.domain = scale.range = function(_) {
    return arguments.length ? (domain = Array.from(_, number), scale) : domain.slice();
  };

  scale.unknown = function(_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };

  scale.copy = function() {
    return identity(domain).unknown(unknown);
  };

  domain = arguments.length ? Array.from(domain, number) : [0, 1];

  return linearish(scale);
}

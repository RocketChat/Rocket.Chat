module.export({default:()=>tickFormat});let tickStep;module.link("d3-array",{tickStep(v){tickStep=v}},0);let format,formatPrefix,formatSpecifier,precisionFixed,precisionPrefix,precisionRound;module.link("d3-format",{format(v){format=v},formatPrefix(v){formatPrefix=v},formatSpecifier(v){formatSpecifier=v},precisionFixed(v){precisionFixed=v},precisionPrefix(v){precisionPrefix=v},precisionRound(v){precisionRound=v}},1);


function tickFormat(start, stop, count, specifier) {
  var step = tickStep(start, stop, count),
      precision;
  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s": {
      var value = Math.max(Math.abs(start), Math.abs(stop));
      if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
      return formatPrefix(specifier, value);
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
      break;
    }
    case "f":
    case "%": {
      if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
      break;
    }
  }
  return format(specifier);
}

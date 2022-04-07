module.export({isoSpecifier:()=>isoSpecifier});let utcFormat;module.link("./defaultLocale.js",{utcFormat(v){utcFormat=v}},0);

var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";

function formatIsoNative(date) {
  return date.toISOString();
}

var formatIso = Date.prototype.toISOString
    ? formatIsoNative
    : utcFormat(isoSpecifier);

module.exportDefault(formatIso);

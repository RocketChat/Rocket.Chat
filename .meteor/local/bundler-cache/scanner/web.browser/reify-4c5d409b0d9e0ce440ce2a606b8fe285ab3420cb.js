let isoSpecifier;module.link("./isoFormat.js",{isoSpecifier(v){isoSpecifier=v}},0);let utcParse;module.link("./defaultLocale.js",{utcParse(v){utcParse=v}},1);


function parseIsoNative(string) {
  var date = new Date(string);
  return isNaN(date) ? null : date;
}

var parseIso = +new Date("2000-01-01T00:00:00.000Z")
    ? parseIsoNative
    : utcParse(isoSpecifier);

module.exportDefault(parseIso);

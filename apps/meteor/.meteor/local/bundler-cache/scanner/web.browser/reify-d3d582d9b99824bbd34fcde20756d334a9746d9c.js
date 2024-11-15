let invert;module.link('./invert.js',{default(v){invert=v}},0);let escapeMap;module.link('./_escapeMap.js',{default(v){escapeMap=v}},1);


// Internal list of HTML entities for unescaping.
module.exportDefault(invert(escapeMap));

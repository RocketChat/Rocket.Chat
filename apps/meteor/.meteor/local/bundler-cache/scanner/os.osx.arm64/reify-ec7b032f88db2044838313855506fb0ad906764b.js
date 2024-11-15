module.export({getParsedByObject:()=>getParsedByObject,getParsedByString:()=>getParsedByString,parsePath:()=>parsePath,getLocation:()=>getLocation,getPosition:()=>getPosition,jsonpos:()=>jsonpos});let getParsedByObject,getParsedByString;module.link('./parse.js',{getParsedByObject(v){getParsedByObject=v},getParsedByString(v){getParsedByString=v}},0);let parsePath;module.link('./path.js',{parsePath(v){parsePath=v}},1);let getLocation;module.link('./location.js',{getLocation(v){getLocation=v}},2);let getPosition;module.link('./position.js',{getPosition(v){getPosition=v}},3);module.link('./path.js',{parseJsonPointerPath:"parseJsonPointerPath",parseJsonPointerSegment:"parseJsonPointerSegment",encodeJsonPointerPath:"encodeJsonPointerPath",encodeJsonPointerSegment:"encodeJsonPointerSegment"},4);







function jsonpos(json, options) {
    return getLocation(typeof json === 'string'
        ? getParsedByString(json)
        : getParsedByObject(json), options);
}


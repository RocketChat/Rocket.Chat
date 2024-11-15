module.export({getParsedByString:()=>getParsedByString,getParsedByObject:()=>getParsedByObject});let parse;module.link('json-cst',{parse(v){parse=v}},0);
function getParsedByString(jsonString, json) {
    const jsonDoc = parse(jsonString);
    return {
        json: json || JSON.parse(jsonString),
        jsonString,
        jsonDoc,
    };
}
function getParsedByObject(json, indent = 4) {
    const jsonString = JSON.stringify(json !== null && json !== void 0 ? json : null, null, indent);
    const ret = getParsedByString(jsonString);
    // When we get undefined as input, mimic null behavior
    if (json === undefined) {
        ret.json = undefined;
        ret.jsonString = 'undefined';
        ret.jsonDoc = undefined;
    }
    return ret;
}

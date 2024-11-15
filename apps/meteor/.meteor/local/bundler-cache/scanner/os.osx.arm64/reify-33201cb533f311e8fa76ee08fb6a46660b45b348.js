module.export({printCode:()=>printCode},true);let codeFrameColumns;module.link('awesome-code-frame',{codeFrameColumns(v){codeFrameColumns=v}},0);let getLocation;module.link('jsonpos',{getLocation(v){getLocation=v}},1);

const printCode = (message, parsedJson, { path, markIdentifier, linesAbove = 5, linesBelow = 3, colors, }) => {
    const { start, end } = getLocation(parsedJson, { path, markIdentifier });
    if (!start)
        return `{The path ${path} cannot be found in json}`;
    return codeFrameColumns(parsedJson.jsonString, { start, end }, {
        highlightCode: colors,
        message,
        linesAbove,
        linesBelow,
    });
};

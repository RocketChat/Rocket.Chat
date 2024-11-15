module.export({makePrintCode:()=>makePrintCode});function makePrintCode(enabled, colors, printCode) {
    return (message, parsedJson, options) => !enabled
        ? ''
        : printCode(message, parsedJson, { colors, ...options });
}

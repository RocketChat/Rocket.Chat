module.export({makePrettify:()=>makePrettify});let getParsedByObject;module.link("jsonpos",{getParsedByObject(v){getParsedByObject=v}},0);let ensureArray;module.link("./util.js",{ensureArray(v){ensureArray=v}},1);let parseDataPath;module.link("./data-path.js",{parseDataPath(v){parseDataPath=v}},2);let prepareText;module.link("./big-numbers/index.js",{prepareText(v){prepareText=v}},3);let makeManager;module.link("./style/manager.js",{makeManager(v){makeManager=v}},4);let plainOptions;module.link("./style/style-plain.js",{managerOptions(v){plainOptions=v}},5);let makePrintCode;module.link("./code/types.js",{makePrintCode(v){makePrintCode=v}},6);let handlers;module.link("./prettifications/index.js",{handlers(v){handlers=v}},7);







function makePrettify(managerOptions, printCode, environment) {
    const styleManager = makeManager(managerOptions);
    const styleManagerPlain = makeManager(plainOptions);
    const getManager = (colors) => styleManager.ensureColorUsage(colors)
        ? styleManager
        : styleManagerPlain;
    return function prettify(validate, opts) {
        if (typeof validate === 'function') {
            const styleManager = getManager(opts === null || opts === void 0 ? void 0 : opts.colors);
            return _prettify({
                errors: ensureArray(validate.errors),
                schema: validate.schema,
                data: opts === null || opts === void 0 ? void 0 : opts.data,
                styleManager,
                printCode,
                location: opts === null || opts === void 0 ? void 0 : opts.location,
                bigNumbers: opts === null || opts === void 0 ? void 0 : opts.bigNumbers,
                environment,
            });
        }
        else {
            const styleManager = getManager(validate === null || validate === void 0 ? void 0 : validate.colors);
            return _prettify({
                location: undefined,
                bigNumbers: undefined,
                ...validate,
                styleManager,
                printCode,
                environment,
            });
        }
    };
}
function initOptionsWithDefaults(options) {
    var _a, _b;
    const location = (_a = options.location) !== null && _a !== void 0 ? _a : (options.environment === 'node');
    const bigNumbers = location &&
        ((_b = options.bigNumbers) !== null && _b !== void 0 ? _b : (options.environment === 'node'));
    const printCode = makePrintCode(location, options.styleManager.support, options.printCode);
    return { ...options, location, bigNumbers, printCode };
}
function _prettify(_opts) {
    const opts = initOptionsWithDefaults(_opts);
    const { styleManager, printCode, bigNumbers } = opts;
    const errors = mergeTypeErrors(ensureArray(opts.errors));
    if (errors.length === 0)
        return styleManager.style.good("No errors");
    const parsedJson = getParsedByObject(opts.data, 2);
    const preparedText = prepareText({ maxNumber: errors.length + 1 });
    return errors.map((error, index) => {
        const context = {
            errors: opts.errors,
            schema: opts.schema,
            data: opts.data,
            styleManager,
            printCode,
            error,
            dataPath: parseDataPath(error),
            parsedJson,
        };
        const errorLines = prettifyOne(context).split("\n");
        if (!bigNumbers || errors.length === 1)
            return errorLines.join("\n");
        return preparedText.printAsPrefix(index + 1, errorLines, { separator: '  ' })
            .join("\n");
    })
        .join("\n\n");
}
function getPrettyError(context) {
    const handler = handlers[context.error.keyword];
    return handler
        ? handler(context)
        : handlers.unknownError(context);
}
function prettifyOne(context) {
    return context.styleManager.printError(getPrettyError(context));
}
function mergeTypeErrors(errors) {
    const toRemove = new Set();
    errors.filter(error => error.keyword === 'anyOf').forEach(error => {
        error.typeErrors =
            errors
                .filter(typeError => typeError.dataPath === error.dataPath &&
                typeError.keyword === 'type');
        error.typeErrors.forEach(error => { toRemove.add(error); });
    });
    return errors.filter(error => !toRemove.has(error));
}

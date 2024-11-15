module.export({suggest:()=>suggest,formatSuggestions:()=>formatSuggestions,formatBestSuggestion:()=>formatBestSuggestion,suggestTypedValue:()=>suggestTypedValue});let leven;module.link('leven',{default(v){leven=v}},0);let getValueType,getTypedValueKey,getTypedValue;module.link('./types.js',{getValueType(v){getValueType=v},getTypedValueKey(v){getTypedValueKey=v},getTypedValue(v){getTypedValue=v}},1);let uniq;module.link('./util.js',{uniq(v){uniq=v}},2);


const defaultLimit = (length) => length < 3 ? 1 : length < 5 ? 2 : 3;
function suggest(value, possibles, opts = {}) {
    if (!possibles)
        return undefined;
    value = `${value}`;
    const { length } = value;
    const { limit = defaultLimit, referenceValue } = opts;
    const distanceLimit = typeof limit === 'number' ? limit : limit(length);
    const suggestions = [];
    const rest = [];
    possibles
        .map(possible => getTypedValue(possible))
        .map(valueType => ({
        ...valueType,
        distance: valueType.isSimple
            ? leven(value, `${valueType.value}`)
            : Infinity,
    }))
        .sort((a, b) => a.distance === b.distance ? 0 : a.distance < b.distance ? -1 : 1)
        .forEach(({ distance, type, value, isSimple }) => {
        const suggest = distanceLimit === -1 || distance <= distanceLimit;
        if (suggest)
            suggestions.push({ type, value, isSimple });
        else
            rest.push({ type, value, isSimple });
    });
    // The rest should be alphabetically ordered, it's easier to grasp
    rest.sort((a, b) => `${a.value}`.localeCompare(`${b.value}`));
    const ret = {
        suggestions,
        rest,
        referenceValue,
        best: suggestions === null || suggestions === void 0 ? void 0 : suggestions[0],
    };
    return ret;
}
function formatSuggestions(list, context, opts = {}) {
    var _a, _b;
    if (!list)
        return '';
    const { styleManager: { style, formatTypedValue, printEnum } } = context;
    const ifSuggestResult = Array.isArray(list === null || list === void 0 ? void 0 : list.rest)
        ? list
        : undefined;
    const rest = (_a = ifSuggestResult === null || ifSuggestResult === void 0 ? void 0 : ifSuggestResult.rest) !== null && _a !== void 0 ? _a : [];
    const suggestions = (_b = ifSuggestResult === null || ifSuggestResult === void 0 ? void 0 : ifSuggestResult.suggestions) !== null && _b !== void 0 ? _b : list;
    const { untyped: defaultUntyped, referenceValue = ifSuggestResult === null || ifSuggestResult === void 0 ? void 0 : ifSuggestResult.referenceValue, isSuggestion, isConst = false, } = opts;
    const referenceType = referenceValue === undefined
        ? undefined
        : getValueType(referenceValue);
    const useUntyped = () => defaultUntyped !== null && defaultUntyped !== void 0 ? defaultUntyped : false;
    const useType = (suggestion) => referenceValue === undefined
        ? false
        : referenceType !== suggestion.type;
    const formatUntyped = (suggestion) => formatTypedValue(suggestion, {
        untyped: useUntyped(),
        includeType: useType(suggestion),
    });
    const uniqSuggestions = uniq(suggestions, getTypedValueKey);
    const allSuggestions = [...uniqSuggestions, ...rest];
    const styledSuggestion = allSuggestions.length === 1
        ? formatUntyped(allSuggestions[0])
        : allSuggestions.length === 2
            ?
                formatUntyped(allSuggestions[0]) +
                    style.title(" or ") +
                    formatUntyped(allSuggestions[1])
            :
                style.title("any of:") + "\n" +
                    printEnum([
                        ...uniqSuggestions.map(suggestion => formatUntyped(suggestion)),
                        ...(rest.length === 0 ? [] : [
                            "other available values:",
                            ...printEnum(rest.map(suggestion => formatUntyped(suggestion)), { indent: 2, bullet: false })
                        ])
                    ])
                        .join("\n");
    const isQuestion = allSuggestions.length !== 1 && !isConst;
    return (!isSuggestion ? '' :
        style.title(`, ${isQuestion ? 'did you mean' : 'it must be'} `)) +
        styledSuggestion +
        (isQuestion && isSuggestion && uniqSuggestions.length < 3
            ? style.title('?')
            : '');
}
function formatBestSuggestion({ best, referenceValue }, context) {
    if (!best)
        return undefined;
    const includeType = referenceValue === undefined
        ? false
        : getValueType(referenceValue) !== best.type;
    return context.styleManager.formatTypedValue(best, { untyped: false, includeType });
}
function suggestTypedValue(value, types, context) {
    if (typeof value === 'string' && types.includes("number"))
        return {
            type: "number",
            value: context.styleManager.formatTypedValue({ value, type: 'number', isSimple: true }),
        };
    else if (typeof value === 'number' && types.includes("string"))
        return {
            type: "string",
            value: context.styleManager.formatTypedValue({ value: `${value}`, type: 'string', isSimple: true }),
        };
    else
        return undefined;
}

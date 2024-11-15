module.export({getError:()=>getError,getTypedContext:()=>getTypedContext,suggestAnotherType:()=>suggestAnotherType});module.export({getValueType:()=>getValueType,getTypedValue:()=>getTypedValue,getTypedValueKey:()=>getTypedValueKey,isSimpleValue:()=>isSimpleValue},true);function getError(context) {
    return context.error;
}
function getTypedContext(context) {
    return context;
}
const getValueType = (value) => value === null ? 'null' : typeof value;
const getTypedValue = (value) => value == null || typeof value !== 'object'
    ? { value, type: getValueType(value), isSimple: true }
    : Array.isArray(value)
        ? { value: '[...]', type: 'array', isSimple: false }
        : { value: '{...}', type: 'object', isSimple: false };
const getTypedValueKey = ({ type, value }) => type + "::" + value;
const isSimpleValue = (possible) => possible === null ||
    typeof possible === 'boolean' ||
    typeof possible === 'number' ||
    typeof possible === 'string';
function suggestAnotherType(value, toType) {
    const { isSimple, type: fromType } = getTypedValue(value);
    if (!isSimple)
        return;
    const convert = () => {
        if (fromType === 'null') {
            if (toType === 'string')
                return 'null';
            else if (toType === 'number')
                return 0;
            else if (toType === 'boolean')
                return false;
        }
        else if (fromType === 'boolean') {
            if (toType === 'string')
                return `${value}`;
            else if (toType === 'number')
                return value ? 1 : 0;
            else if (toType === 'null')
                return value ? undefined : null;
        }
        else if (fromType === 'number') {
            if (toType === 'string')
                return `${value}`;
            else if (toType === 'boolean')
                return value === 0 ? false : value === 1 ? true : undefined;
            else if (toType === 'null')
                return value === 0 ? null : undefined;
        }
        else if (fromType === 'string') {
            if (toType === 'number')
                return isNaN(Number(value)) ? undefined : Number(value);
            else if (toType === 'boolean')
                return value === "true"
                    ? true
                    : value === "false"
                        ? false
                        : undefined;
            else if (toType === 'null')
                return value === "null" ? null : undefined;
        }
        return;
    };
    const ret = convert();
    if (ret === undefined)
        return undefined;
    return getTypedValue(ret);
}

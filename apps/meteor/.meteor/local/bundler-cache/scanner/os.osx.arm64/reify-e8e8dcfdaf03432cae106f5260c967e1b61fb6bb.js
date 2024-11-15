module.export({objectOf:()=>objectOf});const empty = {};
function objectOf(value, key) {
    if (value === undefined)
        return empty;
    return { [key]: value };
}

module.export({ensureArray:()=>ensureArray,uniq:()=>uniq});module.export({enquote:()=>enquote},true);function ensureArray(t) {
    return t == null ? [] : Array.isArray(t) ? [...t] : [t];
}
const enquote = (text) => `"${text}"`;
function uniq(values, keygen) {
    const cache = new Set();
    return values.filter(value => {
        const key = keygen(value);
        if (cache.has(key))
            return false;
        cache.add(key);
        return true;
    });
}

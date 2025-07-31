export function createRandomToken(size, base = 32) {
    let token = '';
    for (let i = 0; i < size; i++) {
        const r = Math.floor(Math.random() * base);
        token += r.toString(base);
    }
    return token;
}
//# sourceMappingURL=createRandomToken.js.map
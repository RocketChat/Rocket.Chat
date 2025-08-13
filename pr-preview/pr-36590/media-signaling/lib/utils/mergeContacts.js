export function mergeContacts(oldContact, newContact) {
    if (!oldContact || !newContact) {
        return newContact || oldContact;
    }
    if (!Object.keys(newContact).length) {
        return oldContact;
    }
    if (!Object.keys(oldContact).length) {
        return newContact;
    }
    const keys = ['type', 'id', 'username', 'sipExtension'];
    for (const key of keys) {
        if (oldContact[key] && newContact[key] && oldContact[key] !== newContact[key]) {
            return newContact;
        }
    }
    return Object.assign(Object.assign({}, oldContact), newContact);
}
//# sourceMappingURL=mergeContacts.js.map
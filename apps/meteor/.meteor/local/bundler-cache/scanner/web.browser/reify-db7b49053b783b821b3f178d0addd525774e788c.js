module.export({ensureAnchorElement:()=>ensureAnchorElement,refAnchorElement:()=>refAnchorElement,unrefAnchorElement:()=>unrefAnchorElement},true);const ensureAnchorElement = (id) => {
    const existingAnchor = document.getElementById(id);
    if (existingAnchor)
        return existingAnchor;
    const newAnchor = document.createElement('div');
    newAnchor.id = id;
    document.body.appendChild(newAnchor);
    return newAnchor;
};
const getAnchorRefCount = (anchorElement) => {
    const { refCount } = anchorElement.dataset;
    if (refCount)
        return parseInt(refCount, 10);
    return 0;
};
const setAnchorRefCount = (anchorElement, refCount) => {
    anchorElement.dataset.refCount = String(refCount);
};
const refAnchorElement = (anchorElement) => {
    setAnchorRefCount(anchorElement, getAnchorRefCount(anchorElement) + 1);
};
const unrefAnchorElement = (anchorElement) => {
    const refCount = getAnchorRefCount(anchorElement) - 1;
    setAnchorRefCount(anchorElement, refCount);
    if (refCount <= 0) {
        document.body.removeChild(anchorElement);
    }
};
//# sourceMappingURL=anchors.js.map
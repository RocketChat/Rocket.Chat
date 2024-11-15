module.export({setPrettify:()=>setPrettify,getPrettify:()=>getPrettify});let _prettify;
function setPrettify(instance) {
    _prettify = instance;
}
function getPrettify() {
    return _prettify;
}

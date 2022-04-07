module.export({default:()=>isElement});// Is a given value a DOM element?
function isElement(obj) {
  return !!(obj && obj.nodeType === 1);
}

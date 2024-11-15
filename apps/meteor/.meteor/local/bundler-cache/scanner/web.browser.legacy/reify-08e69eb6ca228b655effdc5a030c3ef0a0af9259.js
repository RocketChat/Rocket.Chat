module.export({isObject:function(){return isObject},extend:function(){return extend},needsNavigation:function(){return needsNavigation},needsPagination:function(){return needsPagination},needsScrollbar:function(){return needsScrollbar},uniqueClasses:function(){return uniqueClasses},attrToProp:function(){return attrToProp},wrapperClass:function(){return wrapperClass}});function isObject(o) {
  return typeof o === 'object' && o !== null && o.constructor && Object.prototype.toString.call(o).slice(8, -1) === 'Object';
}
function extend(target, src) {
  const noExtend = ['__proto__', 'constructor', 'prototype'];
  Object.keys(src).filter(key => noExtend.indexOf(key) < 0).forEach(key => {
    if (typeof target[key] === 'undefined') target[key] = src[key];else if (isObject(src[key]) && isObject(target[key]) && Object.keys(src[key]).length > 0) {
      if (src[key].__swiper__) target[key] = src[key];else extend(target[key], src[key]);
    } else {
      target[key] = src[key];
    }
  });
}
function needsNavigation(params = {}) {
  return params.navigation && typeof params.navigation.nextEl === 'undefined' && typeof params.navigation.prevEl === 'undefined';
}
function needsPagination(params = {}) {
  return params.pagination && typeof params.pagination.el === 'undefined';
}
function needsScrollbar(params = {}) {
  return params.scrollbar && typeof params.scrollbar.el === 'undefined';
}
function uniqueClasses(classNames = '') {
  const classes = classNames.split(' ').map(c => c.trim()).filter(c => !!c);
  const unique = [];
  classes.forEach(c => {
    if (unique.indexOf(c) < 0) unique.push(c);
  });
  return unique.join(' ');
}
function attrToProp(attrName = '') {
  return attrName.replace(/-[a-z]/g, l => l.toUpperCase().replace('-', ''));
}
function wrapperClass(className = '') {
  if (!className) return 'swiper-wrapper';
  if (!className.includes('swiper-wrapper')) return `swiper-wrapper ${className}`;
  return className;
}

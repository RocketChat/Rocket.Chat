module.exports = function(aFunc) {
  return /^function\s*\S*\s*\((.|[\n\r\u2028\u2029])*\)\s*{[\s;]*}$/g.test(aFunc.toString());
};

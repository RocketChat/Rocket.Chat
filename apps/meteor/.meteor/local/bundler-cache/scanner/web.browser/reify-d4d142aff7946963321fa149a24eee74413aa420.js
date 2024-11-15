var createFunction = require('./createFunction');
var isString = function(v){return typeof v === 'string';};

//create a contructor function dynamically.
module.exports = function(name, args, body) {
  if (isString(args)) {
    body = args;
    args = [];
  }
  if (body == null) body = 'return ' + name + '.__super__.constructor.apply(this, arguments);'
  return createFunction(name, args, body);
};

var isEmptyFunction = require('./isEmptyFunction')
var getPrototypeOf    = require('./getPrototypeOf');

var objectSuperCtor = getPrototypeOf(Object);

//get latest non-empty constructor function through inherits link:
module.exports = function (ctor) {
  var result = ctor;
  var isEmpty = isEmptyFunction(result);
  // console.log(result.toString(), isEmpty)
  var v  = result.super_ || getPrototypeOf(result);
  while (isEmpty && v && v !== objectSuperCtor) {
    result  = v;
    v  = result.super_ || getPrototypeOf(result);
    isEmpty = isEmptyFunction(result);
  }
  // console.log(result.toString())
  //if (isEmpty) result = null;
  return result;
}


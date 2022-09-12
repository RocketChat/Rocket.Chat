let tagTester;module.link('./_tagTester.js',{default(v){tagTester=v}},0);let has;module.link('./_has.js',{default(v){has=v}},1);


var isArguments = tagTester('Arguments');

// Define a fallback version of the method in browsers (ahem, IE < 9), where
// there isn't any inspectable "Arguments" type.
(function() {
  if (!isArguments(arguments)) {
    isArguments = function(obj) {
      return has(obj, 'callee');
    };
  }
}());

module.exportDefault(isArguments);

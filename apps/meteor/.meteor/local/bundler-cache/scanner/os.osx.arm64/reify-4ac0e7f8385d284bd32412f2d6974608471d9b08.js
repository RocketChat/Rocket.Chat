module.export({underscore:()=>underscore});
const underscore = function(str){
  return str.replace(/([A-Z])/g, function(_, match){
    return '_' + match.toLowerCase();
  });
};



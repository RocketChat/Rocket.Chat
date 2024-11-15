module.export({is_object:()=>is_object});
const is_object = function(obj){
  return (typeof obj === 'object' && obj !== null && !Array.isArray(obj));
};



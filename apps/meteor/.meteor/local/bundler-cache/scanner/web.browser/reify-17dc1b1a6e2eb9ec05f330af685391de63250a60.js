let REGEX;module.link('./regex.js',{default(v){REGEX=v}},0);
function validate(uuid) {
  return typeof uuid === 'string' && REGEX.test(uuid);
}
module.exportDefault(validate);
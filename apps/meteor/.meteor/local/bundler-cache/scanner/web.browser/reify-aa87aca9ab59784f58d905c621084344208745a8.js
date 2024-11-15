let validate;module.link('./validate.js',{default(v){validate=v}},0);
function version(uuid) {
  if (!validate(uuid)) {
    throw TypeError('Invalid UUID');
  }
  return parseInt(uuid.slice(14, 15), 16);
}
module.exportDefault(version);
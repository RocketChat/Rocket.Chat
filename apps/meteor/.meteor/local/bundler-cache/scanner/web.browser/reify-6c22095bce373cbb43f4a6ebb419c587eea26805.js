let validate;module.link('./validate.js',{default(v){validate=v}},0);

function version(uuid) {
  if (!validate(uuid)) {
    throw TypeError('Invalid UUID');
  }

  return parseInt(uuid.substr(14, 1), 16);
}

module.exportDefault(version);
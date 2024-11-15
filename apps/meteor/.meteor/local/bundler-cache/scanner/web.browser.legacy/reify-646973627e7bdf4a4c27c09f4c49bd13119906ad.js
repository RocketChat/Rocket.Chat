// useMessageFormatter is deprecated, but has a large dependency on intl-messageformat
// that we want to avoid. If it is built into the same file as the rest of the package,
// it deopts tree shaking in Parcel even when unused. Instead, it is split into a separate
// file and re-exported here, which allows tree shaking to work properly.
module.exports = require('./real-main.js');
Object.defineProperties(module.exports, Object.getOwnPropertyDescriptors(require('./useMessageFormatter.js')));

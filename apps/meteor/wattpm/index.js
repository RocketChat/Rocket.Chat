process.argv.splice(2, 0, 'program.json');
require('./runtime.js')({ cache_dir: process.env.METEOR_REIFY_CACHE_DIR })
require('./boot.js')

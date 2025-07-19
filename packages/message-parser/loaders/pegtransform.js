// @ts-check
const pegjs = require('peggy');

module.exports = {
  process: (content) => ({
    code: pegjs.generate(content, {
      output: 'source',
      format: 'es',
      dependencies: {
        utils: './utils.ts',
      },
    }),
  }),
};

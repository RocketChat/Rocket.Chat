const pegjs = require('peggy');

module.exports = {
  process: (content) => ({
    code: pegjs.generate(content, {
      output: 'source',
      format: 'commonjs',
      // We rely on a tracer to prevent recurrence on rules like Bold, Italic, Strikethrough and References
      trace: true,
    }),
  }),
};

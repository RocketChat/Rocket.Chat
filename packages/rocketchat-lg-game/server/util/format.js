/* global formatUsage:true, formatError:true */
/* exported formatUsage, formatError */

// Rocket.Chat's version of highlight.js that formats blocks of code between
// triple-backticks doesn't support a "plaintext" non-highlighted mode, so
// we fake it with the "diff" language that it does support
formatUsage = text => `\`\`\`diff\n${text}\`\`\``

formatError = msg => {
  return msg.toString()
    // ensure prefixed with bold 'Error:'
    .replace(/(^Error: )?(.*)/, '**Error:** $2')
}

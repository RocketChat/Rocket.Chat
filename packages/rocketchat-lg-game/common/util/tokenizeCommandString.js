/* global tokenizeCommandString:true */
/* exported tokenizeCommandString */

// TODO: THIS SHOULD BE ITS OWN NPM MODULE

const SPACE = ' '.charCodeAt(0)
const DOUBLE_QUOTE = '"'.charCodeAt(0)
const SINGLE_QUOTE = "'".charCodeAt(0)

tokenizeCommandString = commandStr => {
  const argv = []
  for (let i = 0, endPos = 0; i < commandStr.length; ++i) {
    if (commandStr.charCodeAt(i) === SPACE) {
      continue
    } else if (commandStr.charCodeAt(i) === SINGLE_QUOTE) {
      endPos = indexOfQuotedStringEnd(commandStr, ++i, commandStr.length, {quote: "'"})
    } else if (commandStr.charCodeAt(i) === DOUBLE_QUOTE) {
      endPos = indexOfQuotedStringEnd(commandStr, ++i, commandStr.length, {quote: '"'})
    } else {
      endPos = indexOfWordEnd(commandStr, i, commandStr.length)
    }
    const arg = commandStr.slice(i, endPos).replace(/\\(.)/g, '$1')
    argv.push(arg)
    i = endPos
  }
  return argv
}

function indexOfQuotedStringEnd(chars, pos, len, opts) {
  const options = Object.assign({escape: '\\', quote: '"'}, opts)
  const ESCAPE = options.escape.charCodeAt(0)
  const QUOTE = options.quote.charCodeAt(0)
  let escaping = false
  for (let i = pos; i < len; ++i) {
    if (!escaping) {
      if (chars.charCodeAt(i) === ESCAPE) {
        escaping = true
      } else if (chars.charCodeAt(i) === QUOTE) {
        return i
      }
    } else {
      escaping = false
    }
  }
  throw new Error(`unmatched quote: ${options.quote}`)
}

function indexOfWordEnd(chars, pos, len, opts) {
  const options = Object.assign({escape: '\\'}, opts)
  const ESCAPE = options.escape.charCodeAt(0)
  let escaping = false
  for (let i = pos; i <= len; ++i) {
    if (!escaping) {
      if (chars.charCodeAt(i) === ESCAPE) {
        escaping = true
      } else if (chars.charCodeAt(i) === SPACE) {
        return i
      }
    } else {
      escaping = false
    }
  }
  return len
}

// --- TESTS ---

// const str1 = '  1st 2nd "third has \\"quotes\\"" 4th  '
// tokenizeCommandString(str1).forEach(arg => console.log(arg))
//
// console.log('---')
//
// const str2 = "  1st 2nd 'here\\'s the 3rd' 4th  "
// tokenizeCommandString(str2).forEach(arg => console.log(arg))
//
// console.log('---')
//
// const str3 = "  1st 2nd this\\ is\\ 3rd 4th"
// tokenizeCommandString(str3).forEach(arg => console.log(arg))

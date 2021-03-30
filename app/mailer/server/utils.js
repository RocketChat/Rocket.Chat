export const replaceVariables = (str, callback) => str.replace(/\{ *([^\{\} ]+)[^\{\}]*\}/gmi, callback);

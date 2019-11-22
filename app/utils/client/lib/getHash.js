const crypto = require('crypto');

export const getHash = function(stringValue) { return crypto.createHash('sha1').update(stringValue).digest('hex'); };

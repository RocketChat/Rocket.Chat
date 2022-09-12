var qrcode = require('./qrcode.js');

var gen = function(text, options) {
    options = options || {};
    var typeNumber = options.typeNumber || 4;
    var errorCorrectLevel = options.errorCorrectLevel || 'M';
    var size = options.size || 500;

    var qr;

    try {
        qr = qrcode(typeNumber, errorCorrectLevel || 'M');
        qr.addData(text);
        qr.make();
    } catch (e) {
        if(typeNumber >= 40) {
            throw new Error('Text too long to encode');
        } else {
            return gen(text, {
                size: size,
                errorCorrectLevel: errorCorrectLevel,
                typeNumber: typeNumber + 1
            });
        }
    }

    // calc cellsize and margin
    var cellsize = parseInt(size / qr.getModuleCount());
    var margin = parseInt((size - qr.getModuleCount() * cellsize) / 2);

    return qr.createImgTag(cellsize, margin, size);
};

module.exports = gen;

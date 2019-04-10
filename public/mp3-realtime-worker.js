'use strict';

(function () {
  importScripts('lame.min.js');

	var encoder;
	var maxSamples = 1152;
	var samplesMono;
	var config;
	var dataBuffer;

  function convertBuffer(arrayBuffer) {
    var input = new Float32Array(arrayBuffer);
    var output = new Int16Array(arrayBuffer.length);

		for (var i = 0; i < input.length; i++) {
      var s = Math.max(-1, Math.min(1, input[i]));
      output[i] = (s < 0 ? s * 0x8000 : s * 0x7FFF);
    }

    return output;
  }

  function init(config) {
    config = config || {};
    encoder = new lamejs.Mp3Encoder(config.numChannels || 1, config.sampleRate || 44100, config.bitRate || 32);
    dataBuffer = [];
  }

  function encode(arrayBuffer) {
    samplesMono = convertBuffer(arrayBuffer);
    var remaining = samplesMono.length;
    for (var i = 0; remaining >= 0; i += maxSamples) {
      var left = samplesMono.subarray(i, i + maxSamples);
      var buffer = encoder.encodeBuffer(left);
      dataBuffer.push(new Int8Array(buffer));
      remaining -= maxSamples;
    }
  };

  function finish() {
		var buffer = encoder.flush();
		dataBuffer.push(new Int8Array(buffer));
    self.postMessage({ command: 'end', buffer: dataBuffer });
    dataBuffer = [];
  };

  self.onmessage = function (event) {
    switch (event.data.command) {
      case 'init':
        init(event.data.config);
        break;

      case 'encode':
        encode(event.data.buffer);
        break;

      case 'finish':
        finish();
        break;
    }
  };
})();

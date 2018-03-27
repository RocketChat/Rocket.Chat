(function () {
  'use strict';

  importScripts('lame.min.js');

  var mp3Encoder, maxSamples = 1152, samplesMono, config, dataBuffer;
  var clearBuffer = function () {
    dataBuffer = [];
  };

  var appendToBuffer = function (mp3Buf) {
    dataBuffer.push(new Int8Array(mp3Buf));
  };


  var init = function (prefConfig) {
    config = prefConfig || {};
    mp3Encoder = new lamejs.Mp3Encoder(1, config.sampleRate || 44100, config.bitRate || 128);
    clearBuffer();
  };

  var floatTo16BitPCM = function floatTo16BitPCM(input, output) {
    for (var i = 0; i < input.length; i++) {
      var s = Math.max(-1, Math.min(1, input[i]));
      output[i] = (s < 0 ? s * 0x8000 : s * 0x7FFF);
    }
  };

  var convertBuffer = function(arrayBuffer){
    var data = new Float32Array(arrayBuffer);
    var out = new Int16Array(arrayBuffer.length);
    floatTo16BitPCM(data, out)
    return out;
  };

  var encode = function (arrayBuffer) {
    samplesMono = convertBuffer(arrayBuffer);
    var remaining = samplesMono.length;
    for (var i = 0; remaining >= 0; i += maxSamples) {
      var left = samplesMono.subarray(i, i + maxSamples);
      var mp3buf = mp3Encoder.encodeBuffer(left);
      appendToBuffer(mp3buf);
      remaining -= maxSamples;
    }

  };

  var finish = function () {
    appendToBuffer(mp3Encoder.flush());
    self.postMessage({
      command: 'end',
      buffer: dataBuffer
    });
    clearBuffer();
  };

  self.onmessage = function (e) {
    switch (e.data.command) {
      case 'init':
        init(e.data.config);
        break;

      case 'encode':
        encode(e.data.buffer);
        break;

      case 'finish':
        finish();
        break;
    }
  };

})();

import * as T from './transformers.min.js';
T.env.backends.onnx.wasm.wasmPaths = '/hf/';
window.HFTransformers = T;
window.dispatchEvent(new Event('hf-loaded'));

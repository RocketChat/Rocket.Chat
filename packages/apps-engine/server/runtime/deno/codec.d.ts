import { Decoder as _Decoder, Encoder as _Encoder } from '@msgpack/msgpack';
/**
 * The Encoder and Decoder classes perform "stateful" operations, i.e. they read from a
 * stream, store the data locally and decode it from its buffer.
 *
 * In practice, this affects the decoder when there is decode error. After an error, the decoder
 * keeps the malformed data in its buffer, and even if we try to decode from another source (e.g. different stream)
 * it will fail again as there's still data in the buffer.
 *
 * For that reason, we can't have a singleton instance of Encoder and Decoder, but rather one
 * instance for each time we create a new subprocess
 */
export declare const newEncoder: () => _Encoder<undefined>;
export declare const newDecoder: () => _Decoder<undefined>;
export type Encoder = _Encoder;
export type Decoder = _Decoder;

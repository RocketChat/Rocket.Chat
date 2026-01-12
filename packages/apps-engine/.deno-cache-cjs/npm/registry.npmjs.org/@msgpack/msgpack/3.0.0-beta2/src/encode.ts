import { Encoder } from "./Encoder";
import type { EncoderOptions } from "./Encoder";
import type { SplitUndefined } from "./context";

/**
 * @deprecated Use {@link EncoderOptions} instead.
 */
export type EncodeOptions = never;

/**
 * @deprecated No longer supported.
 */
export const defaultEncodeOptions: never = undefined as never;

/**
 * It encodes `value` in the MessagePack format and
 * returns a byte buffer.
 *
 * The returned buffer is a slice of a larger `ArrayBuffer`, so you have to use its `#byteOffset` and `#byteLength` in order to convert it to another typed arrays including NodeJS `Buffer`.
 */
export function encode<ContextType = undefined>(
  value: unknown,
  options?: EncoderOptions<SplitUndefined<ContextType>>,
): Uint8Array {
  const encoder = new Encoder(options);
  return encoder.encodeSharedRef(value);
}

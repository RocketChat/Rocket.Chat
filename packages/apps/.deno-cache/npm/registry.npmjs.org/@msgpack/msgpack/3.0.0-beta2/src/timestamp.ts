// https://github.com/msgpack/msgpack/blob/master/spec.md#timestamp-extension-type
import { DecodeError } from "./DecodeError";
import { getInt64, setInt64 } from "./utils/int";

export const EXT_TIMESTAMP = -1;

export type TimeSpec = {
  sec: number;
  nsec: number;
};

const TIMESTAMP32_MAX_SEC = 0x100000000 - 1; // 32-bit unsigned int
const TIMESTAMP64_MAX_SEC = 0x400000000 - 1; // 34-bit unsigned int

export function encodeTimeSpecToTimestamp({ sec, nsec }: TimeSpec): Uint8Array {
  if (sec >= 0 && nsec >= 0 && sec <= TIMESTAMP64_MAX_SEC) {
    // Here sec >= 0 && nsec >= 0
    if (nsec === 0 && sec <= TIMESTAMP32_MAX_SEC) {
      // timestamp 32 = { sec32 (unsigned) }
      const rv = new Uint8Array(4);
      const view = new DataView(rv.buffer);
      view.setUint32(0, sec);
      return rv;
    } else {
      // timestamp 64 = { nsec30 (unsigned), sec34 (unsigned) }
      const secHigh = sec / 0x100000000;
      const secLow = sec & 0xffffffff;
      const rv = new Uint8Array(8);
      const view = new DataView(rv.buffer);
      // nsec30 | secHigh2
      view.setUint32(0, (nsec << 2) | (secHigh & 0x3));
      // secLow32
      view.setUint32(4, secLow);
      return rv;
    }
  } else {
    // timestamp 96 = { nsec32 (unsigned), sec64 (signed) }
    const rv = new Uint8Array(12);
    const view = new DataView(rv.buffer);
    view.setUint32(0, nsec);
    setInt64(view, 4, sec);
    return rv;
  }
}

export function encodeDateToTimeSpec(date: Date): TimeSpec {
  const msec = date.getTime();
  const sec = Math.floor(msec / 1e3);
  const nsec = (msec - sec * 1e3) * 1e6;

  // Normalizes { sec, nsec } to ensure nsec is unsigned.
  const nsecInSec = Math.floor(nsec / 1e9);
  return {
    sec: sec + nsecInSec,
    nsec: nsec - nsecInSec * 1e9,
  };
}

export function encodeTimestampExtension(object: unknown): Uint8Array | null {
  if (object instanceof Date) {
    const timeSpec = encodeDateToTimeSpec(object);
    return encodeTimeSpecToTimestamp(timeSpec);
  } else {
    return null;
  }
}

export function decodeTimestampToTimeSpec(data: Uint8Array): TimeSpec {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  // data may be 32, 64, or 96 bits
  switch (data.byteLength) {
    case 4: {
      // timestamp 32 = { sec32 }
      const sec = view.getUint32(0);
      const nsec = 0;
      return { sec, nsec };
    }
    case 8: {
      // timestamp 64 = { nsec30, sec34 }
      const nsec30AndSecHigh2 = view.getUint32(0);
      const secLow32 = view.getUint32(4);
      const sec = (nsec30AndSecHigh2 & 0x3) * 0x100000000 + secLow32;
      const nsec = nsec30AndSecHigh2 >>> 2;
      return { sec, nsec };
    }
    case 12: {
      // timestamp 96 = { nsec32 (unsigned), sec64 (signed) }

      const sec = getInt64(view, 4);
      const nsec = view.getUint32(0);
      return { sec, nsec };
    }
    default:
      throw new DecodeError(`Unrecognized data size for timestamp (expected 4, 8, or 12): ${data.length}`);
  }
}

export function decodeTimestampExtension(data: Uint8Array): Date {
  const timeSpec = decodeTimestampToTimeSpec(data);
  return new Date(timeSpec.sec * 1e3 + timeSpec.nsec / 1e6);
}

export const timestampExtension = {
  type: EXT_TIMESTAMP,
  encode: encodeTimestampExtension,
  decode: decodeTimestampExtension,
};

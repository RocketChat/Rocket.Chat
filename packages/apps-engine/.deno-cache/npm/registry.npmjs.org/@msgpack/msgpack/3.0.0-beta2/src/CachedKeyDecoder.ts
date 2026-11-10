import { utf8DecodeJs } from "./utils/utf8";

const DEFAULT_MAX_KEY_LENGTH = 16;
const DEFAULT_MAX_LENGTH_PER_KEY = 16;

export interface KeyDecoder {
  canBeCached(byteLength: number): boolean;
  decode(bytes: Uint8Array, inputOffset: number, byteLength: number): string;
}
interface KeyCacheRecord {
  readonly bytes: Uint8Array;
  readonly str: string;
}

export class CachedKeyDecoder implements KeyDecoder {
  hit = 0;
  miss = 0;
  private readonly caches: Array<Array<KeyCacheRecord>>;

  constructor(readonly maxKeyLength = DEFAULT_MAX_KEY_LENGTH, readonly maxLengthPerKey = DEFAULT_MAX_LENGTH_PER_KEY) {
    // avoid `new Array(N)`, which makes a sparse array,
    // because a sparse array is typically slower than a non-sparse array.
    this.caches = [];
    for (let i = 0; i < this.maxKeyLength; i++) {
      this.caches.push([]);
    }
  }

  public canBeCached(byteLength: number): boolean {
    return byteLength > 0 && byteLength <= this.maxKeyLength;
  }

  private find(bytes: Uint8Array, inputOffset: number, byteLength: number): string | null {
    const records = this.caches[byteLength - 1]!;

    FIND_CHUNK: for (const record of records) {
      const recordBytes = record.bytes;

      for (let j = 0; j < byteLength; j++) {
        if (recordBytes[j] !== bytes[inputOffset + j]) {
          continue FIND_CHUNK;
        }
      }
      return record.str;
    }
    return null;
  }

  private store(bytes: Uint8Array, value: string) {
    const records = this.caches[bytes.length - 1]!;
    const record: KeyCacheRecord = { bytes, str: value };

    if (records.length >= this.maxLengthPerKey) {
      // `records` are full!
      // Set `record` to an arbitrary position.
      records[(Math.random() * records.length) | 0] = record;
    } else {
      records.push(record);
    }
  }

  public decode(bytes: Uint8Array, inputOffset: number, byteLength: number): string {
    const cachedValue = this.find(bytes, inputOffset, byteLength);
    if (cachedValue != null) {
      this.hit++;
      return cachedValue;
    }
    this.miss++;

    const str = utf8DecodeJs(bytes, inputOffset, byteLength);
    // Ensure to copy a slice of bytes because the byte may be NodeJS Buffer and Buffer#slice() returns a reference to its internal ArrayBuffer.
    const slicedCopyOfBytes = Uint8Array.prototype.slice.call(bytes, inputOffset, inputOffset + byteLength);
    this.store(slicedCopyOfBytes, str);
    return str;
  }
}

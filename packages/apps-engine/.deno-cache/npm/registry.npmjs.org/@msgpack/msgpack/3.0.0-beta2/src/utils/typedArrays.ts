export function ensureUint8Array(buffer: ArrayLike<number> | Uint8Array | ArrayBufferView | ArrayBuffer): Uint8Array {
  if (buffer instanceof Uint8Array) {
    return buffer;
  } else if (ArrayBuffer.isView(buffer)) {
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  } else if (buffer instanceof ArrayBuffer) {
    return new Uint8Array(buffer);
  } else {
    // ArrayLike<number>
    return Uint8Array.from(buffer);
  }
}

export function createDataView(buffer: ArrayLike<number> | ArrayBufferView | ArrayBuffer): DataView {
  if (buffer instanceof ArrayBuffer) {
    return new DataView(buffer);
  }

  const bufferView = ensureUint8Array(buffer);
  return new DataView(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);
}

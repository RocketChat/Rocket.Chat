/**
 * ExtData is used to handle Extension Types that are not registered to ExtensionCodec.
 */
export class ExtData {
  constructor(readonly type: number, readonly data: Uint8Array) {}
}

export interface ICodec<TIn, TOut, TEnc = TIn> {
	decode: (data: TIn) => TOut;
	encode: (data: TOut) => TEnc;
}

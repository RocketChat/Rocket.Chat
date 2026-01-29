export const enum BSONType {
	Double = 1,
	String,
	Object,
	Array,
	BinData,
	/** @deprecated */
	Undefined,
	ObjectId,
	Boolean,
	Date,
	Null,
	Regex,
	/** @deprecated */
	DBPointer,
	JavaScript,
	/** @deprecated */
	Symbol,
	JavaScriptWithScope,
	Int,
	Timestamp,
	Long,
	Decimal,
	MinKey = -1,
	MaxKey = 127,
}

export type ArrayIndices = (number | 'x')[];

export type LookupBranch = {
	value: unknown;
	dontIterate?: boolean;
	arrayIndices?: ArrayIndices;
};

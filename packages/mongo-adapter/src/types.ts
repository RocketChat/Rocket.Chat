export const enum BSONType {
	Double = 1,
	String = 2,
	Object = 3,
	Array = 4,
	BinData = 5,
	/** @deprecated */
	Undefined = 6,
	ObjectId = 7,
	Boolean = 8,
	Date = 9,
	Null = 10,
	Regex = 11,
	/** @deprecated */
	DBPointer = 12,
	JavaScript = 13,
	/** @deprecated */
	Symbol = 14,
	JavaScriptWithScope = 15,
	Int = 16,
	Timestamp = 17,
	Long = 18,
	Decimal = 19,
	MinKey = -1,
	MaxKey = 127,
}

export type ArrayIndices = (number | 'x')[];

export type LookupBranch = {
	value: unknown;
	dontIterate?: boolean;
	arrayIndices?: ArrayIndices;
};

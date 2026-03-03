export const BlockContext = {
	NONE: Symbol('none'),
	BLOCK: Symbol('block'),
	SECTION: Symbol('section'),
	ACTION: Symbol('action'),
	FORM: Symbol('form'),
	CONTEXT: Symbol('context'),
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type BlockContext = (typeof BlockContext)[keyof typeof BlockContext];

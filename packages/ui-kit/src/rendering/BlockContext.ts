const NONE = Symbol('none');
const BLOCK = Symbol('block');
const SECTION = Symbol('section');
const ACTION = Symbol('action');
const FORM = Symbol('form');
const CONTEXT = Symbol('context');

export const BlockContext = {
	NONE,
	BLOCK,
	SECTION,
	ACTION,
	FORM,
	CONTEXT,
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type BlockContext = (typeof BlockContext)[keyof typeof BlockContext];

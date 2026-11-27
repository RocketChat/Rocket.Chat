import type { DisplayContract } from '../../types/Display.contract';

export type FieldContract = DisplayContract;

export type FieldRowContract = DisplayContract & {
	/** Packs the row's content at the end of the line. */
	justify?: 'end';
};

/** The description, the hint and the error of a field. */
export type FieldTextContract = DisplayContract;

export type FieldLinkContract = DisplayContract;

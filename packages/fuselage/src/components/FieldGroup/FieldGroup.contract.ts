import type { DisplayContract } from '../../types/Display.contract';

export type FieldGroupContract = DisplayContract & {
	/** Disables every control inside the group. */
	disabled?: boolean;
};

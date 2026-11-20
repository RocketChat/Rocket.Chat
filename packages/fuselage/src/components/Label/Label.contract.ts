import type { DisplayContract } from '../../types/Display.contract';

export type LabelContract = DisplayContract & {
	disabled?: boolean;
	required?: boolean;
};

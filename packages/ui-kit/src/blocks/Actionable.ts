import type { ConfirmationDialog } from './ConfirmationDialog.js';
import type { InputElementDispatchAction } from './InputElementDispatchAction.js';

export type Actionable<Block> = Block & {
	appId: string;
	blockId: string;
	actionId: string;
	confirm?: ConfirmationDialog;
	dispatchActionConfig?: InputElementDispatchAction[];
};

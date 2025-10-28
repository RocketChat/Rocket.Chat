import type { ConfirmationDialog } from './ConfirmationDialog';
import type { InputElementDispatchAction } from './InputElementDispatchAction';

export type Actionable<Block> = Block & {
	appId: string;
	blockId: string;
	actionId: string;
	confirm?: ConfirmationDialog;
	dispatchActionConfig?: InputElementDispatchAction[];
};

import { action } from '@storybook/addon-actions';

export const UIKitInteractionType = {
	MODAL_OPEN: 'modal.open',
	MODAL_CLOSE: 'modal.close',
	MODAL_UPDATE: 'modal.update',
	ERRORS: 'errors',
};

export const UIKitIncomingInteractionType = {
	BLOCK: 'blockAction',
	VIEW_SUBMIT: 'viewSubmit',
	VIEW_CLOSED: 'viewClosed',
};

export const UIKitIncomingInteractionContainerType = {
	MESSAGE: 'message',
	VIEW: 'view',
};

export const triggerAction = async (payload) => {
	await new Promise((resolve) => setTimeout(resolve, 1000));
	action('dispatchAction')(payload);
};

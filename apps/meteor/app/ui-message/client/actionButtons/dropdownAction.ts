import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';

import { AccountBox } from '../../../ui-utils/client/lib/AccountBox';

export const onAdded = async (button: IUIActionButton): Promise<void> => {
	const { appId, actionId, labelI18n, context } = button;
	await AccountBox.addItem({
		...button,
		name: button.labelI18n,
		appId,
		actionId,
		labelI18n,
		context,
		isAppButtonItem: true,
	});
};
export const onRemoved = async (button: IUIActionButton): Promise<void> => {
	const { appId, actionId, labelI18n, context } = button;
	AccountBox.deleteItem({
		...button,
		name: button.labelI18n,
		appId,
		actionId,
		labelI18n,
		context,
		isAppButtonItem: true,
	});
};

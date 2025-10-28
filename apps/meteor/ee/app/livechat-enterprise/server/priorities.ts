import type { ILivechatPriority } from '@rocket.chat/core-typings';
import { LivechatPriorityWeight } from '@rocket.chat/core-typings';
import { LivechatPriority } from '@rocket.chat/models';

const defaultPriorities: Omit<ILivechatPriority, '_id' | '_updatedAt'>[] = [
	{
		i18n: 'Lowest',
		sortItem: LivechatPriorityWeight.LOWEST,
		dirty: false,
	},
	{
		i18n: 'Low',
		sortItem: LivechatPriorityWeight.LOW,
		dirty: false,
	},
	{
		i18n: 'Medium',
		sortItem: LivechatPriorityWeight.MEDIUM,
		dirty: false,
	},
	{
		i18n: 'High',
		sortItem: LivechatPriorityWeight.HIGH,
		dirty: false,
	},
	{
		i18n: 'Highest',
		sortItem: LivechatPriorityWeight.HIGHEST,
		dirty: false,
	},
];

export const createDefaultPriorities = async (): Promise<void> => {
	const priorities = await LivechatPriority.estimatedDocumentCount();

	if (!priorities) {
		await LivechatPriority.insertMany(defaultPriorities);
	}
};

import { LivechatPriority } from '@rocket.chat/models';
import type { ILivechatPriority } from '@rocket.chat/core-typings';

const defaultPriorities: Omit<ILivechatPriority, '_id' | '_updatedAt'>[] = [
	{
		i18n: 'Lowest',
		sortItem: 5,
		dirty: false,
	},
	{
		i18n: 'Low',
		sortItem: 4,
		dirty: false,
	},
	{
		i18n: 'Medium',
		sortItem: 3,
		dirty: false,
	},
	{
		i18n: 'High',
		sortItem: 2,
		dirty: false,
	},
	{
		i18n: 'Highest',
		sortItem: 1,
		dirty: false,
	},
];

export const createDefaultPriorities = async (): Promise<void> => {
	const priorities = await LivechatPriority.find().toArray();

	if (!priorities.length) {
		await LivechatPriority.insertMany(defaultPriorities);
	}
};

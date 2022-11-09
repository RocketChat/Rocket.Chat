import { LivechatPriority } from '@rocket.chat/models';
import type { ILivechatPriority } from '@rocket.chat/core-typings';

const defaultPriorities: Omit<ILivechatPriority, '_id' | '_updatedAt'>[] = [
	{
		name: 'Lowest',
		defaultValue: 'Lowest',
		i18n: 'Lowest',
		sortItem: 5,
		dirty: false,
	},
	{
		name: 'Low',
		defaultValue: 'Low',
		i18n: 'Low',
		sortItem: 4,
		dirty: false,
	},
	{
		name: 'Medium',
		defaultValue: 'Medium',
		i18n: 'Medium',
		sortItem: 3,
		dirty: false,
	},
	{
		name: 'High',
		defaultValue: 'High',
		i18n: 'High',
		sortItem: 2,
		dirty: false,
	},
	{
		name: 'Highest',
		defaultValue: 'Highest',
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

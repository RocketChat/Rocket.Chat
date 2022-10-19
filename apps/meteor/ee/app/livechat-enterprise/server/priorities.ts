import { LivechatPriority } from '@rocket.chat/models';
import type { ILivechatPriority } from '@rocket.chat/core-typings';

const defaultPriorities: Omit<ILivechatPriority, '_id' | '_updatedAt'>[] = [
	{
		name: 'Lowest',
		defaultValue: 'Lowest',
		icon: 'low',
		sortItem: 5,
		dirty: false,
	},
	{
		name: 'Low',
		defaultValue: 'Low',
		icon: 'low',
		sortItem: 4,
		dirty: false,
	},
	{
		name: 'Medium',
		defaultValue: 'Medium',
		icon: 'medium',
		sortItem: 3,
		dirty: false,
	},
	{
		name: 'High',
		defaultValue: 'High',
		icon: 'high',
		sortItem: 2,
		dirty: false,
	},
	{
		name: 'Highest',
		defaultValue: 'Highest',
		icon: 'high',
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

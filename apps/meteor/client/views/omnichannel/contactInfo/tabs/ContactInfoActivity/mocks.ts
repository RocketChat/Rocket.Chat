import type { ActivityItem } from './useActivityList';

export const mockActivityList: ActivityItem[] = [
	{
		id: '123',
		name: 'Haylie George',
		status: { id: 'sent', ts: new Date().toISOString() },
	},
	{
		id: '234',
		name: 'Haylie George',
		status: { id: 'delivered', ts: new Date().toISOString() },
	},
];

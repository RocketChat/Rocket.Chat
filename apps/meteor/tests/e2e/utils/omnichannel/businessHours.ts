import type { BaseTest } from '../test';

type CreateBusinessHoursParams = {
	id?: string | null;
	name?: string;
	description?: string;
	departments?: { departmentId: string }[];
};

export const createBusinessHour = async (api: BaseTest['api'], { id = null, name, departments = [] }: CreateBusinessHoursParams = {}) => {
	const departmentIds = departments.join(',');

	const response = await api.post('/method.call/livechat:saveBusinessHour', {
		message: JSON.stringify({
			msg: 'method',
			id: id || '33',
			method: 'livechat:saveBusinessHour',
			params: [
				{
					name,
					timezoneName: 'America/Sao_Paulo',
					daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
					daysTime: [
						{ day: 'Monday', start: { time: '08:00' }, finish: { time: '18:00' }, open: true },
						{ day: 'Tuesday', start: { time: '08:00' }, finish: { time: '18:00' }, open: true },
						{ day: 'Wednesday', start: { time: '08:00' }, finish: { time: '18:00' }, open: true },
						{ day: 'Thursday', start: { time: '08:00' }, finish: { time: '18:00' }, open: true },
						{ day: 'Friday', start: { time: '08:00' }, finish: { time: '18:00' }, open: true },
					],
					departmentsToApplyBusinessHour: departmentIds,
					active: true,
					type: 'custom',
					timezone: 'America/Sao_Paulo',
					workHours: [
						{ day: 'Monday', start: '08:00', finish: '18:00', open: true },
						{ day: 'Tuesday', start: '08:00', finish: '18:00', open: true },
						{ day: 'Wednesday', start: '08:00', finish: '18:00', open: true },
						{ day: 'Thursday', start: '08:00', finish: '18:00', open: true },
						{ day: 'Friday', start: '08:00', finish: '18:00', open: true },
					],
				},
			],
		}),
	});

	return response;
};

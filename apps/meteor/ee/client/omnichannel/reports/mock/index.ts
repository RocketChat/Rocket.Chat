import { faker } from '@faker-js/faker';

export const MOCK_STATUS_DATA = {
	data: [
		{ label: 'Open', value: 37.5 },
		{ label: 'Queued', value: 25 },
		{ label: 'On hold', value: 25 },
		{ label: 'Closed', value: 12.5 },
	],
	success: true,
};

export const MOCK_DEPARTMENTS_DATA = {
	data: [
		{
			label: 'Sales',
			value: 50,
		},
		{
			label: 'Support',
			value: 30,
		},
		{
			label: 'Marketing',
			value: 20,
		},
		{
			label: 'Engineering',
			value: 10,
		},
		{
			label: 'Human Resources',
			value: 5,
		},
	],
	success: true,
};

export const MOCK_AGENTS_DATA = {
	data: Array.from({ length: 5 }, (_, i) => ({
		label: faker.person.fullName(),
		value: Math.max(i * 10, 5),
	})).reverse(),
	success: true,
};

export const MOCK_CHANNELS_DATA = {
	data: Array.from({ length: 5 }, (_, i) => ({
		label: faker.person.fullName(),
		value: Math.max(i * 10, 5),
	})),
	success: true,
};

export const MOCK_TAGS_DATA = {
	data: Array.from({ length: 50 }, (_, i) => ({
		label: faker.person.fullName(),
		value: Math.max(i * 10, 5),
	})),
	success: true,
};

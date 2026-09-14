import { ajv } from './Ajv';

const testConnectionSuccessResponseSchema = {
	type: 'object',
	properties: {
		provider: { type: 'string' },
		message: { type: 'string' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['provider', 'message', 'success'],
	additionalProperties: false,
};

export const validateExchangeTestConnectionSuccessResponse = ajv.compile<{ provider: string; message: string; success: true }>(
	testConnectionSuccessResponseSchema,
);

const syncMyCalendarSuccessResponseSchema = {
	type: 'object',
	properties: {
		upserted: { type: 'integer' },
		modified: { type: 'integer' },
		deleted: { type: 'integer' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['upserted', 'modified', 'deleted', 'success'],
	additionalProperties: false,
};

export const validateExchangeSyncMyCalendarSuccessResponse = ajv.compile<{
	upserted: number;
	modified: number;
	deleted: number;
	success: true;
}>(syncMyCalendarSuccessResponseSchema);

const syncMyContactsSuccessResponseSchema = {
	type: 'object',
	properties: {
		folders: { type: 'integer' },
		upserted: { type: 'integer' },
		modified: { type: 'integer' },
		deleted: { type: 'integer' },
		pruned: { type: 'integer' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['folders', 'upserted', 'modified', 'deleted', 'pruned', 'success'],
	additionalProperties: false,
};

type test = {
	folders: number;
	upserted: number;
	modified: number;
	deleted: number;
	pruned: number;
	success: true;
};

export const validateExchangeSyncMyContactsSuccessResponse = ajv.compile<test>(syncMyContactsSuccessResponseSchema);

export type ExchangeEndpoints = {
	'/v1/exchange.testConnection': {
		POST: () => {
			provider: string;
			message: string;
		};
	};
	'/v1/exchange.syncMyCalendar': {
		POST: () => {
			upserted: number;
			modified: number;
			deleted: number;
		};
	};
	'/v1/exchange.syncMyContacts': {
		POST: () => {
			folders: number;
			upserted: number;
			modified: number;
			deleted: number;
			pruned: number;
		};
	};
};

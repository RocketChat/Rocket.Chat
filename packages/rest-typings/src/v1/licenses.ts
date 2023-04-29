import type { ILicense } from '@rocket.chat/core-typings';

import { ajv } from '../helpers/schemas';

type licensesAddProps = {
	license: string;
};

const licensesAddPropsSchema = {
	type: 'object',
	properties: {
		license: {
			type: 'string',
		},
	},
	required: ['license'],
	additionalProperties: false,
};

export const isLicensesAddProps = ajv.compile<licensesAddProps>(licensesAddPropsSchema);

export type LicensesEndpoints = {
	'/v1/licenses.get': {
		GET: () => { licenses: Array<ILicense> };
	};
	'/v1/licenses.add': {
		POST: (params: licensesAddProps) => void;
	};
	'/v1/licenses.maxActiveUsers': {
		GET: () => { maxActiveUsers: number | null; activeUsers: number };
	};
	'/v1/licenses.requestSeatsLink': {
		GET: () => { url: string };
	};
	'/v1/licenses.isEnterprise': {
		GET: () => { isEnterprise: boolean };
	};
};

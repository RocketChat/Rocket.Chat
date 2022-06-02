import type { ILicense } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

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
	'licenses.get': {
		GET: () => { licenses: Array<ILicense> };
	};
	'licenses.add': {
		POST: (params: licensesAddProps) => void;
	};
	'licenses.maxActiveUsers': {
		GET: () => { maxActiveUsers: number | null; activeUsers: number };
	};
	'licenses.requestSeatsLink': {
		GET: () => { url: string };
	};
};

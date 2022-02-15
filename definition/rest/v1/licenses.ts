import Ajv, { JSONSchemaType } from 'ajv';

import type { ILicense } from '../../../ee/app/license/definitions/ILicense';

const ajv = new Ajv();

type licensesAddProps = {
	license: string;
};

const licensesAddPropsSchema: JSONSchemaType<licensesAddProps> = {
	type: 'object',
	properties: {
		license: {
			type: 'string',
		},
	},
	required: ['license'],
	additionalProperties: false,
};

export const isLicensesAdd = ajv.compile(licensesAddPropsSchema);

// ENDPOINTS:
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

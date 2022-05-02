import type { ILicense } from '@rocket.chat/core-typings';

export type LicensesEndpoints = {
	'licenses.get': {
		GET: () => { licenses: Array<ILicense> };
	};
	'licenses.add': {
		POST: (params: { license: string }) => void;
	};
	'licenses.maxActiveUsers': {
		GET: () => { maxActiveUsers: number | null; activeUsers: number };
	};
	'licenses.requestSeatsLink': {
		GET: () => { url: string };
	};
};

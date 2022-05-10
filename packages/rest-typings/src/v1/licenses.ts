import type { ILicense } from '@rocket.chat/core-typings';

export type LicensesEndpoints = {
	'/v1/licenses.get': {
		GET: () => { licenses: Array<ILicense> };
	};
	'/v1/licenses.add': {
		POST: (params: { license: string }) => void;
	};
	'/v1/licenses.maxActiveUsers': {
		GET: () => { maxActiveUsers: number | null; activeUsers: number };
	};
	'/v1/licenses.requestSeatsLink': {
		GET: () => { url: string };
	};
};

import type { ILicense } from '../../../../../ee/app/license/server/license';

export type LicensesEndpoints = {
	'licenses.get': {
		GET: (params: void) => { licenses: Array<ILicense> };
	};
	'licenses.maxActiveUsers': {
		GET: (params: void) => { maxActiveUsers: number | null; activeUsers: number };
	};
	'licenses.requestSeatsLink': {
		GET: (params: void) => { url: string };
	};
};

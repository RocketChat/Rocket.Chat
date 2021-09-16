import type { ILicense } from '../../../../../ee/app/license/server/license';

export type LicensesEndpoints = {
	'licenses.get': {
		GET: () => { licenses: Array<ILicense> };
	};
	'licenses.maxActiveUsers': {
		GET: () => { maxActiveUsers: number | null; activeUsers: number };
	};
	'licenses.requestSeatsLink': {
		GET: () => { url: string };
	};
};

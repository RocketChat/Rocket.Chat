import { ILicense } from '../../../../../../ee/app/license/server/license';

export type LicensesGetEndpoint = {
	GET: (params: void) => { licenses: Array<ILicense> };
};

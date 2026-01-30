import { LicenseImp } from '../src';

export { MockedLicenseBuilder } from '../src/MockedLicenseBuilder';

export const getReadyLicenseManager = async () => {
	const license = new LicenseImp();
	await license.setWorkspaceUrl('http://localhost:3000');

	license.setLicenseLimitCounter('activeUsers', () => 0);
	license.setLicenseLimitCounter('guestUsers', () => 0);
	license.setLicenseLimitCounter('roomsPerGuest', async () => 0);
	license.setLicenseLimitCounter('privateApps', () => 0);
	license.setLicenseLimitCounter('marketplaceApps', () => 0);
	license.setLicenseLimitCounter('monthlyActiveContacts', async () => 0);
	return license;
};

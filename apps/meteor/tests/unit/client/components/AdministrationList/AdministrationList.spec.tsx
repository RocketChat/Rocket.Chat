import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import React from 'react';

const mockAdministrationListModule = (stubs = {}) => {
	return proxyquire.noCallThru().load('../../../../../client/components/AdministrationList/AdministrationList', {
		'@rocket.chat/ui-contexts': {
			useAtLeastOnePermission: () => true,
		},
		'../../../app/ui-utils/client/lib/AccountBox': {
			AccountBoxItem: {},
			isAppAccountBoxItem: () => false,
		},
		'../../../ee/client/hooks/useHasLicenseModule': {
			useHasLicenseModule: () => true,
		},
		'./AdministrationModelList': () => <p>Administration Model List</p>,
		'./AppsModelList': () => <p>Apps Model List</p>,
		'./AuditModelList': () => <p>Audit Model List</p>,
		...stubs,
		// eslint-disable-next-line @typescript-eslint/consistent-type-imports
	}) as typeof import('../../../../../client/components/AdministrationList/AdministrationList');
};

describe('components/AdministrationList/AdministrationList', () => {
	it('should render all model list', async () => {
		const AdministrationList = mockAdministrationListModule().default;
		render(
			<AdministrationList
				accountBoxItems={[{} as any]}
				hasAuditPermission={true}
				hasAuditLogPermission={true}
				hasManageApps={true}
				hasAdminPermission={true}
				hasAuditLicense={false}
				onDismiss={() => null}
			/>,
		);

		expect(screen.getByText('Administration Model List')).to.exist;
		expect(screen.getByText('Apps Model List')).to.exist;
		expect(screen.getByText('Audit Model List')).to.exist;
	});

	it('should render nothing when no permission', async () => {
		const AdministrationList = mockAdministrationListModule({
			'@rocket.chat/ui-contexts': {
				useAtLeastOnePermission: () => false,
			},
		}).default;
		render(
			<AdministrationList
				hasAdminPermission={false}
				hasAuditLicense={false}
				hasAuditLogPermission={false}
				hasAuditPermission={false}
				hasManageApps={false}
				accountBoxItems={[]}
				onDismiss={() => null}
			/>,
		);

		expect(screen.queryByText('Administration Model List')).to.not.exist;
		expect(screen.queryByText('Apps Model List')).to.not.exist;
		expect(screen.queryByText('Audit Model List')).to.not.exist;
	});

	it('should render administration model list when has account box item', async () => {
		const AdministrationList = mockAdministrationListModule({
			'@rocket.chat/ui-contexts': {
				useAtLeastOnePermission: () => false,
			},
		}).default;
		render(
			<AdministrationList
				hasAdminPermission={false}
				hasAuditLicense={false}
				hasAuditLogPermission={false}
				hasAuditPermission={false}
				hasManageApps={false}
				accountBoxItems={[{} as any]}
				onDismiss={() => null}
			/>,
		);

		expect(screen.getByText('Administration Model List')).to.exist;
		expect(screen.queryByText('Apps Model List')).to.not.exist;
		expect(screen.queryByText('Audit Model List')).to.not.exist;
	});

	it('should render apps model list when has app account box item', async () => {
		const AdministrationList = mockAdministrationListModule({
			'../../../app/ui-utils/client/lib/AccountBox': {
				'AccountBoxItem': {},
				'isAppAccountBoxItem': () => true,
				'@noCallThru': true,
			},
			'@rocket.chat/ui-contexts': {
				useAtLeastOnePermission: () => false,
			},
		}).default;
		render(
			<AdministrationList
				hasAdminPermission={false}
				hasAuditLicense={false}
				hasAuditLogPermission={false}
				hasAuditPermission={false}
				hasManageApps={false}
				accountBoxItems={[{} as any]}
				onDismiss={() => null}
			/>,
		);

		expect(screen.getByText('Apps Model List')).to.exist;
		expect(screen.queryByText('Administration Model List')).to.not.exist;
		expect(screen.queryByText('Audit Model List')).to.not.exist;
	});
});

import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import React from 'react';

const COMPONENT_PATH = '../../../../../client/components/AdministrationList/AdministrationList';
const defaultConfig = {
	'@rocket.chat/ui-contexts': {
		useAtLeastOnePermission: () => true,
	},
	'../../../app/ui-utils/client': {
		SideNav: {},
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
	'./SettingsModelList': () => <p>Settings Model List</p>,
};

describe('components/AdministrationList/AdministrationList', () => {
	it('should render all model list', async () => {
		const AdministrationList = proxyquire.noCallThru().load(COMPONENT_PATH, defaultConfig).default;
		render(<AdministrationList closeList={() => null} accountBoxItems={[]} />);

		expect(screen.getByText('Administration Model List')).to.exist;
		expect(screen.getByText('Apps Model List')).to.exist;
		expect(screen.getByText('Settings Model List')).to.exist;
		expect(screen.getByText('Audit Model List')).to.exist;
	});

	it('should render nothing when no permission', async () => {
		const AdministrationList = proxyquire.noCallThru().load(COMPONENT_PATH, {
			...defaultConfig,
			'@rocket.chat/ui-contexts': {
				useAtLeastOnePermission: () => false,
			},
		}).default;
		render(<AdministrationList closeList={() => null} accountBoxItems={[]} />);

		expect(screen.queryByText('Administration Model List')).to.not.exist;
		expect(screen.queryByText('Apps Model List')).to.not.exist;
		expect(screen.queryByText('Settings Model List')).to.not.exist;
		expect(screen.queryByText('Audit Model List')).to.not.exist;
	});

	it('should render administration model list when has account box item', async () => {
		const AdministrationList = proxyquire.noCallThru().load(COMPONENT_PATH, {
			...defaultConfig,
			'@rocket.chat/ui-contexts': {
				useAtLeastOnePermission: () => false,
			},
		}).default;
		render(<AdministrationList closeList={() => null} accountBoxItems={[{}]} />);

		expect(screen.getByText('Administration Model List')).to.exist;
		expect(screen.queryByText('Apps Model List')).to.not.exist;
		expect(screen.queryByText('Settings Model List')).to.not.exist;
		expect(screen.queryByText('Audit Model List')).to.not.exist;
	});

	it('should render apps model list when has app account box item', async () => {
		const AdministrationList = proxyquire.noCallThru().load(COMPONENT_PATH, {
			...defaultConfig,
			'../../../app/ui-utils/client/lib/AccountBox': {
				'AccountBoxItem': {},
				'isAppAccountBoxItem': () => true,
				'@noCallThru': true,
			},
			'@rocket.chat/ui-contexts': {
				useAtLeastOnePermission: () => false,
			},
		}).default;
		render(<AdministrationList closeList={() => null} accountBoxItems={[{}]} />);

		expect(screen.getByText('Apps Model List')).to.exist;
		expect(screen.queryByText('Administration Model List')).to.not.exist;
		expect(screen.queryByText('Settings Model List')).to.not.exist;
		expect(screen.queryByText('Audit Model List')).to.not.exist;
	});
});

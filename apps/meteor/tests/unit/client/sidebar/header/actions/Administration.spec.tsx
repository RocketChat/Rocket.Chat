import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, spy } from 'chai';
import proxyquire from 'proxyquire';
import type { ReactElement } from 'react';
import React, { Fragment } from 'react';

const COMPONENT_PATH = '../../../../../../client/sidebar/header/actions/Administration';
const defaultConfig = {
	'@rocket.chat/ui-contexts': {
		useAtLeastOnePermission: () => true,
		usePermission: () => false,
	},
	'@rocket.chat/fuselage-hooks': {
		useMutableCallback: (cb: () => null) => cb(),
	},
	'../../../../ee/client/hooks/useHasLicenseModule': {
		useHasLicenseModule: () => true,
	},
	'../../../../app/ui-utils/client': {
		AccountBox: {
			getItems: () => [],
		},
	},
	'../../../../app/ui-utils/client/lib/AccountBox': {
		AccountBoxItem: {},
		isAppAccountBoxItem: () => false,
	},
	'../../../hooks/useReactiveValue': {
		useReactiveValue: (item: unknown) => item,
	},
	'../../../components/AdministrationList/AdministrationModelList': () => <p>Administration Model List</p>,
	'../../../components/AdministrationList/AppsModelList': () => <p>Apps Model List</p>,
	'../../../components/AdministrationList/AuditModelList': () => <p>Audit Model List</p>,
	'../hooks/useDropdownVisibility': {
		useDropdownVisibility: () => ({
			isVisible: true,
			toggle: () => null,
		}),
	},
	'../../../components/AdministrationList/AdministrationList': ({ optionsList }: { optionsList: ReactElement[] }) =>
		optionsList?.map((i, j) => <Fragment key={j}>{i}</Fragment>),
};

describe('sidebar/header/actions/Administration', () => {
	it('should render all model list', async () => {
		const Administration = proxyquire.noCallThru().load(COMPONENT_PATH, {
			...defaultConfig,
			'@rocket.chat/ui-contexts': {
				useAtLeastOnePermission: () => true,
				usePermission: () => true,
			},
		}).default;

		render(<Administration />);

		expect(screen.getByText('Administration Model List')).to.exist;
		expect(screen.getByText('Apps Model List')).to.exist;
		expect(screen.getByText('Audit Model List')).to.exist;
	});

	it('should not render administration list when isVisible false', async () => {
		const Administration = proxyquire.noCallThru().load(COMPONENT_PATH, {
			...defaultConfig,
			'../hooks/useDropdownVisibility': {
				useDropdownVisibility: () => ({
					isVisible: false,
					toggle: () => null,
				}),
			},
		}).default;

		render(<Administration />);

		expect(screen.getByRole('button')).to.exist;
		expect(screen.queryByText('Administration Model List')).to.not.exist;
	});

	it('should render button if has accountBoxItem', async () => {
		const Administration = proxyquire.noCallThru().load(COMPONENT_PATH, {
			...defaultConfig,
			'../../../../app/ui-utils/client': {
				AccountBox: {
					getItems: () => [{}],
				},
			},
			'@rocket.chat/ui-contexts': {
				useAtLeastOnePermission: () => false,
				usePermission: () => false,
			},
		}).default;

		render(<Administration />);

		expect(screen.getByRole('button')).to.exist;
		expect(screen.getByText('Administration Model List')).to.exist;
	});

	it('should not render button if does not have permission', async () => {
		const Administration = proxyquire.noCallThru().load(COMPONENT_PATH, {
			...defaultConfig,
			'@rocket.chat/ui-contexts': {
				useAtLeastOnePermission: () => false,
				usePermission: () => false,
			},
			'../../../../app/ui-utils/client/lib/AccountBox': {
				AccountBoxItem: {},
				isAppAccountBoxItem: () => false,
			},
			'../../../../app/ui-utils/client': {
				AccountBox: {
					getItems: () => [{}],
				},
			},
		}).default;

		render(<Administration />);

		expect(screen.queryByText('button')).to.not.exist;
		expect(screen.getByText('Administration Model List')).to.exist;
	});

	it('should render administration model list when has account box item with no permissions', async () => {
		const Administration = proxyquire.noCallThru().load(COMPONENT_PATH, {
			...defaultConfig,
			'@rocket.chat/ui-contexts': {
				useAtLeastOnePermission: () => false,
				usePermission: () => false,
			},
			'../../../../app/ui-utils/client/lib/AccountBox': {
				AccountBoxItem: {},
				isAppAccountBoxItem: () => false,
			},
			'../../../../app/ui-utils/client': {
				AccountBox: {
					getItems: () => [{}],
				},
			},
		}).default;

		render(<Administration />);

		expect(screen.getByText('Administration Model List')).to.exist;
		expect(screen.queryByText('Apps Model List')).to.not.exist;
		expect(screen.queryByText('Audit Model List')).to.not.exist;
	});

	it('should render apps model list when has app account box item and no permissions', async () => {
		const Administration = proxyquire.noCallThru().load(COMPONENT_PATH, {
			...defaultConfig,
			'@rocket.chat/ui-contexts': {
				useAtLeastOnePermission: () => false,
				usePermission: () => false,
			},
			'../../../../app/ui-utils/client/lib/AccountBox': {
				AccountBoxItem: {},
				isAppAccountBoxItem: () => true,
			},
			'../../../../app/ui-utils/client': {
				AccountBox: {
					getItems: () => [{}],
				},
			},
		}).default;

		render(<Administration />);

		expect(screen.getByText('Apps Model List')).to.exist;
		expect(screen.queryByText('Administration Model List')).to.not.exist;
		expect(screen.queryByText('Audit Model List')).to.not.exist;
	});

	context('when clicked', () => {
		it('should toggle dropdown', async () => {
			const toggle = spy();
			const Administration = proxyquire.noCallThru().load(COMPONENT_PATH, {
				...defaultConfig,
				'../hooks/useDropdownVisibility': {
					useDropdownVisibility: () => ({
						isVisible: true,
						toggle,
					}),
				},
			}).default;

			render(<Administration />);

			userEvent.click(screen.getByRole('button'));
			await waitFor(() => expect(toggle).to.have.been.called());
		});
	});
});

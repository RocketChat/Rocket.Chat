import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, spy } from 'chai';
import proxyquire from 'proxyquire';
import React from 'react';

const COMPONENT_PATH = '../../../../../../client/sidebar/header/actions/Administration';
const defaultConfig = {
	'@rocket.chat/ui-contexts': {
		useAtLeastOnePermission: () => true,
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
	'../../../hooks/useReactiveValue': {
		useReactiveValue: (item: unknown) => item,
	},
	'../hooks/useDropdownVisibility': {
		useDropdownVisibility: () => ({
			isVisible: true,
			toggle: () => null,
		}),
	},
	'../../../components/AdministrationList/AdministrationList': () => <p>Administration List</p>,
};

describe('sidebar/header/actions/Administration', () => {
	it('should render administration list', async () => {
		const Administration = proxyquire.noCallThru().load(COMPONENT_PATH, defaultConfig).default;

		render(<Administration />);

		expect(screen.getByRole('button')).to.exist;
		expect(screen.getByText('Administration List')).to.exist;
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
		expect(screen.queryByText('Administration List')).to.not.exist;
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
			},
		}).default;

		render(<Administration />);

		expect(screen.getByRole('button')).to.exist;
		expect(screen.getByText('Administration List')).to.exist;
	});

	it('should not render button if does not have permission', async () => {
		const Administration = proxyquire.noCallThru().load(COMPONENT_PATH, {
			...defaultConfig,
			'@rocket.chat/ui-contexts': {
				useAtLeastOnePermission: () => false,
			},
		}).default;

		render(<Administration />);

		expect(screen.queryByText('button')).to.not.exist;
		expect(screen.getByText('Administration List')).to.exist;
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

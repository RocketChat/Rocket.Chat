import type { LicenseModule } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import ComposerFederation from './ComposerFederation';
import FakeRoomProvider from '../../../../../tests/mocks/client/FakeRoomProvider';
import { createFakeLicenseInfo } from '../../../../../tests/mocks/data';

jest.mock('../ComposerMessage', () => ({
	__esModule: true,
	default: ({ children }: { children: ReactNode }) => <div data-testid='composer-message'>{children}</div>,
}));

const appRoot = ({ enabled = true, activeModules = ['federation'] }: { enabled?: boolean; activeModules?: LicenseModule[] } = {}) =>
	mockAppRoot()
		.withJohnDoe()
		.withTranslations('en', 'core', {
			Federation_Matrix_Federated_Description_disabled: 'Federation is currently disabled on this workspace',
			Federation_Matrix_join_public_rooms_is_premium: 'Join federated rooms is a Premium feature',
			Federation_Matrix_Federated_Description_invalid_version:
				'This room was created by an old Federation version and its blocked indeterminately. <1>Click here</1> for more information about Matrix Federation support',
		})
		.withSetting('Federation_Matrix_enabled', enabled ?? true)
		.withEndpoint('GET', '/v1/licenses.info', () => ({
			license: createFakeLicenseInfo({ activeModules }),
		}))
		.wrap((children) => <FakeRoomProvider>{children}</FakeRoomProvider>)
		.build();

describe('ComposerFederation', () => {
	it('should display blocked composer if federation version is invalid', () => {
		render(<ComposerFederation blocked />, {
			wrapper: appRoot(),
		});

		expect(screen.getByText(/This room was created by an old Federation version and its blocked indeterminately/)).toBeInTheDocument();
	});

	it('should display disabled composer if federation is disabled', () => {
		render(<ComposerFederation />, {
			wrapper: appRoot({ enabled: false }),
		});

		expect(screen.getByText('Federation is currently disabled on this workspace')).toBeInTheDocument();
	});

	it('should display disabled composer with premium message if federation addon is missing', () => {
		render(<ComposerFederation />, {
			wrapper: appRoot({ activeModules: [] }),
		});

		expect(screen.getByText('Join federated rooms is a Premium feature')).toBeInTheDocument();
	});

	it('should display normal composer if federation is enabled and valid', async () => {
		render(<ComposerFederation />, { wrapper: appRoot() });

		const composer = await screen.findByTestId('composer-message');
		expect(composer).toBeInTheDocument();
	});
});

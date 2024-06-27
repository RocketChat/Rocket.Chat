import { faker } from '@faker-js/faker';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { mockedAppsContext } from '../../../../../../tests/mocks/client/marketplace';
import { createFakeApp, createFakeLicenseInfo } from '../../../../../../tests/mocks/data';
import AppStatus from './AppStatus';

it('should look good', async () => {
	const app = createFakeApp();

	render(<AppStatus app={app} showStatus isAppDetailsPage />, {
		legacyRoot: true,
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('GET', '/apps/count', async () => ({
				maxMarketplaceApps: faker.number.int({ min: 0 }),
				installedApps: faker.number.int({ min: 0 }),
				maxPrivateApps: faker.number.int({ min: 0 }),
				totalMarketplaceEnabled: faker.number.int({ min: 0 }),
				totalPrivateEnabled: faker.number.int({ min: 0 }),
			}))
			.withEndpoint('GET', '/v1/licenses.info', async () => ({
				license: createFakeLicenseInfo(),
			}))
			.wrap(mockedAppsContext)
			.build(),
	});

	await userEvent.click(screen.getByRole('button', { name: 'Request' }));
});

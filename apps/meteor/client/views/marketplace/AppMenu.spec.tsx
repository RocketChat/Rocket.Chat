import { faker } from '@faker-js/faker';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import AppMenu from './AppMenu';
import { mockedAppsContext } from '../../../tests/mocks/client/marketplace';
import { createFakeApp } from '../../../tests/mocks/data';

describe('without app details', () => {
	it('should look good', async () => {
		const app = createFakeApp();

		render(<AppMenu app={app} isAppDetailsPage={false} />, {
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/apps/count', async () => ({
					maxMarketplaceApps: faker.number.int({ min: 0 }),
					installedApps: faker.number.int({ min: 0 }),
					maxPrivateApps: faker.number.int({ min: 0 }),
					totalMarketplaceEnabled: faker.number.int({ min: 0 }),
					totalPrivateEnabled: faker.number.int({ min: 0 }),
				}))
				.wrap(mockedAppsContext)
				.build(),
		});

		expect(screen.getByRole('button', { name: 'More_options' })).toBeInTheDocument();
	});
});

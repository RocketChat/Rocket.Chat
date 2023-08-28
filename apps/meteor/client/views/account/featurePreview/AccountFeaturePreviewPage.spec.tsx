import { mockAppRoot } from '@rocket.chat/mock-providers';
import { defaultFeaturesPreview } from '@rocket.chat/ui-client';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

import AccountFeaturePreviewPage from './AccountFeaturePreviewPage';

expect.extend(toHaveNoViolations);

it('should have no a11y violations', async () => {
	const { container } = render(<AccountFeaturePreviewPage />, {
		wrapper: mockAppRoot()
			.withSetting('Accounts_AllowFeaturePreview', true)
			.withUserPreference('featurePreview', defaultFeaturesPreview)
			.withEndpoint('POST', '/v1/users.setPreferences', () => ({
				user: {
					_id: 'userId',
					settings: {
						profile: {},
						preferences: {},
					},
				},
			}))
			.build(),
	});

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

import { MockedSettingsContext } from '@rocket.chat/mock-providers/src/MockedSettingsContext';
import { MockedUserContext } from '@rocket.chat/mock-providers/src/MockedUserContext';
import { defaultFeaturesPreview } from '@rocket.chat/ui-client';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

import AccountFeaturePreviewPage from './AccountFeaturePreviewPage';

expect.extend(toHaveNoViolations);

it('should have no a11y violations', async () => {
	const { container } = render(<AccountFeaturePreviewPage />, {
		wrapper: ({ children }) => (
			<MockedSettingsContext settings={{ Accounts_AllowFeaturePreview: true }}>
				<MockedUserContext
					userPreferences={{
						featuresPreview: defaultFeaturesPreview,
					}}
				>
					{children}
				</MockedUserContext>
			</MockedSettingsContext>
		),
	});

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

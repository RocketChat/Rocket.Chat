import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

import OmnichannelPreferencesPage from './OmnichannelPreferencesPage';

expect.extend(toHaveNoViolations);

it('should have no a11y violations', async () => {
	const { container } = render(<OmnichannelPreferencesPage />, {
		wrapper: mockAppRoot()
			.withMethod('license:getModules', () => ['livechat-enterprise'])
			.build(),
	});

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

import MailerPage from './MailerPage';

expect.extend(toHaveNoViolations);

it('should have no a11y violations', async () => {
	const { container } = render(<MailerPage />, {
		wrapper: mockAppRoot().build(),
	});

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

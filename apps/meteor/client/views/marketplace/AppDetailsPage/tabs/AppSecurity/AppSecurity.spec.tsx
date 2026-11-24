import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import AppSecurity from './AppSecurity';

test('an empty privacy summary renders no text', () => {
	render(<AppSecurity privacyPolicySummary='' appPermissions={[]} />, { wrapper: mockAppRoot().build() });

	expect(screen.getByRole('paragraph')).toBeEmptyDOMElement();
});

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

import HighContrastUpsellModal from './HighContrastUpsellModal';
import { ProviderMockProvider } from './ProviderMock';

expect.extend(toHaveNoViolations);

it('should have no a11y violations', async () => {
	const { container } = render(<HighContrastUpsellModal onClose={() => undefined} />, {
		wrapper: ({ children }) => <ProviderMockProvider isEnterprise>{children}</ProviderMockProvider>,
	});

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

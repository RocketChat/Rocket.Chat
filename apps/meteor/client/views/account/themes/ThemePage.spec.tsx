import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

import { queryClient, ProviderMockProvider } from './ProviderMock';
import ThemePage from './ThemePage';

expect.extend(toHaveNoViolations);

beforeEach(() => {
	queryClient.clear();
});

describe('should have no a11y violations', () => {
	it('if is enterprise', async () => {
		const { container } = render(<ThemePage />, {
			wrapper: ({ children }) => <ProviderMockProvider isEnterprise>{children}</ProviderMockProvider>,
		});

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('if is not enterprise', async () => {
		const { container } = render(<ThemePage />, {
			wrapper: ({ children }) => <ProviderMockProvider isEnterprise={false}>{children}</ProviderMockProvider>,
		});

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

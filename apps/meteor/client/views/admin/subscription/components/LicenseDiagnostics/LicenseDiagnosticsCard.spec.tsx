import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './LicenseDiagnosticsCard.stories';

const { NotReady, ModulesDisabled } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

it('should not show the license status tag before the workspace URL is known', () => {
	render(<NotReady />, { wrapper: mockAppRoot().build() });

	expect(screen.getByText('License_diagnostics_not_ready')).toBeInTheDocument();
	expect(screen.queryByText('Valid_license')).not.toBeInTheDocument();
});

it('should list the enabled modules', () => {
	render(<ModulesDisabled />, { wrapper: mockAppRoot().build() });

	expect(screen.getByText('auditing, custom-roles')).toBeInTheDocument();
});

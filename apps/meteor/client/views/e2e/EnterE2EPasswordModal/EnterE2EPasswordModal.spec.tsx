/* eslint-disable @typescript-eslint/naming-convention */
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import EnterE2EPasswordModal from '.';
import * as stories from './EnterE2EPasswordModal.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const { baseElement } = render(<Story />);
	expect(baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

it('should render modal and the password input should be focused', () => {
	const inputPlaceholder = 'Please enter your E2E password';
	render(<EnterE2EPasswordModal onConfirm={() => undefined} onClose={() => undefined} onCancel={() => undefined} />, {
		wrapper: mockAppRoot()
			.withTranslations('en', 'core', {
				Please_enter_E2EE_password: inputPlaceholder,
			})
			.build(),
	});
	expect(screen.getByPlaceholderText(inputPlaceholder)).toHaveFocus();
});

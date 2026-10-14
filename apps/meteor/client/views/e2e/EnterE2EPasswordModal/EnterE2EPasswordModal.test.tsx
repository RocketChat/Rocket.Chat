import { it, test } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { expect } from 'expect';
import { axe } from 'jest-axe';

import EnterE2EPasswordModal from '.';
import * as stories from './EnterE2EPasswordModal.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

testCases.forEach(([_storyname, Story]) => {
	test(`renders ${_storyname} without crashing`, async (t) => {
		const { baseElement } = render(<Story />);
		t.assert.snapshot(baseElement);
	});
});
testCases.forEach(([_storyname, Story]) => {
	test(`${_storyname} should have no a11y violations`, async () => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
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

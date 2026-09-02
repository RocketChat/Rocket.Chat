import type { CallPreventionRecord } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import { shouldDisplayPreventedByBox } from './CallHistoryContextualbar';
import * as contextualbarStories from './CallHistoryContextualbar.stories';

const testCases = Object.values(composeStories(contextualbarStories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const view = render(<Story />, { wrapper: mockAppRoot().build() });
	expect(view.baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

describe('shouldDisplayPreventedByBox', () => {
	it('should be false when there is no prevention record', () => {
		expect(shouldDisplayPreventedByBox(undefined)).toBe(false);
	});

	it('should be true when the app wrote a literal reason', () => {
		// The card shows the reason, so the panel adds "Prevented by {app name}" below it (spec §4).
		expect(shouldDisplayPreventedByBox({ appId: 'app', appName: 'Call Policy', text: 'the callee is on a DND list' })).toBe(true);
	});

	it('should be true when the app named an i18n key', () => {
		expect(shouldDisplayPreventedByBox({ appId: 'app', appName: 'Call Policy', text: 'fallback', key: 'k', ns: 'app-app' })).toBe(true);
	});

	it('should be false for a malformed record, whose card already reads "Prevented by {app name}"', () => {
		expect(shouldDisplayPreventedByBox({ appId: 'app', appName: 'Call Policy', text: '' } as CallPreventionRecord)).toBe(false);
	});
});

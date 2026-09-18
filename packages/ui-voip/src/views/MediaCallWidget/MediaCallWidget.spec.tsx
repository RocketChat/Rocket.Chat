import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import MediaCallWidget from './MediaCallWidget';
import * as stories from './MediaCallWidget.stories';
import MockedMediaCallProvider from '../../providers/MockedMediaCallProvider';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const view = render(<Story />, { wrapper: mockAppRoot().build() });
	expect(view.baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

describe('visibility of an unconfirmed call', () => {
	it('stays hidden while the call is not confirmed and the widget is closed', () => {
		const { container } = render(
			<MockedMediaCallProvider state='calling' confirmed={false} instanceProps={{ targetWidgetVisibility: 'closed' }}>
				<MediaCallWidget />
			</MockedMediaCallProvider>,
			{ wrapper: mockAppRoot().build() },
		);

		expect(container).toBeEmptyDOMElement();
	});

	it('renders once the call is confirmed', () => {
		const { container } = render(
			<MockedMediaCallProvider state='calling' confirmed instanceProps={{ targetWidgetVisibility: 'closed' }}>
				<MediaCallWidget />
			</MockedMediaCallProvider>,
			{ wrapper: mockAppRoot().build() },
		);

		expect(container).not.toBeEmptyDOMElement();
	});
});

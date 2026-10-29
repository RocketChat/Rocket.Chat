import type { IThreadMessage } from '@rocket.chat/core-typings';
import { createFakeMessage } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import ThreadMessage from './ThreadMessage';
import * as stories from './ThreadMessage.stories';
import { mockMessageProviders } from '../../../../tests/utils/mockMessageProviders';

const message = createFakeMessage<IThreadMessage>({ _id: 'messageId', tmid: 'main', msg: 'message body' });
const props = { message, sequential: false, unread: false };

const Throwing = () => {
	throw new Error('cannot render');
};

it('should show a reply with its body', () => {
	render(<ThreadMessage {...props} />, { wrapper: mockMessageProviders().wrapper });

	expect(screen.getByText('message body')).toBeInTheDocument();
	expect(screen.getByRole('listitem')).toHaveAttribute('aria-roledescription', 'thread_message');
});

it('should reveal the body of an ignored author once the placeholder is clicked', async () => {
	render(<ThreadMessage {...props} ignoredUser />, { wrapper: mockMessageProviders().wrapper });

	expect(screen.queryByText('message body')).not.toBeInTheDocument();
	await userEvent.click(screen.getByRole('button', { name: 'Message_Ignored' }));
	expect(screen.getByText('message body')).toBeInTheDocument();
});

it('should hide the body when the author gets ignored without remounting', () => {
	const { rerender } = render(<ThreadMessage {...props} />, { wrapper: mockMessageProviders().wrapper });
	expect(screen.getByText('message body')).toBeInTheDocument();

	rerender(<ThreadMessage {...props} ignoredUser />);
	expect(screen.queryByText('message body')).not.toBeInTheDocument();
});

it('should show a placeholder instead of failing when the content cannot be rendered', () => {
	jest.spyOn(console, 'error').mockImplementation(() => undefined);

	render(<ThreadMessage {...props} />, { wrapper: mockMessageProviders({ renderers: { Markup: Throwing } }).wrapper });

	expect(screen.getByText('Message_could_not_be_displayed')).toBeInTheDocument();
});

describe('stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations', async (_storyName, Story) => {
		const { container } = render(<Story />);

		expect(await axe(container)).toHaveNoViolations();
	});
});

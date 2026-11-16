import type { IThreadMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import RoomMessage from './RoomMessage';
import SystemMessage from './SystemMessage';
import ThreadMessage from './ThreadMessage';
import ThreadMessagePreview from './ThreadMessagePreview';
import * as variantsStories from './Variants.stories';
import * as rolesStories from '../header/MessageRoles.stories';

const message = createFakeMessage({ _id: 'messageId', msg: 'message body' });
const reply = createFakeMessage<IThreadMessage>({ _id: 'reply', tmid: 'main', msg: 'a reply' });
const system = createFakeMessage({ _id: 'system', t: 'uj', msg: 'bob' });

it('renders every variant with no provider (R7)', () => {
	jest.spyOn(console, 'error').mockImplementation(() => undefined);
	const wrapper = mockAppRoot().build();

	render(
		<>
			<RoomMessage message={message} sequential={false} unread={false} mention={false} all={false} />
			<SystemMessage message={system} />
			<ThreadMessage message={reply} sequential={false} unread={false} />
			<ThreadMessagePreview message={reply} sequential={false} />
		</>,
		{ wrapper },
	);

	expect(screen.getAllByRole('listitem')).toHaveLength(3);
	expect(screen.getByRole('link')).toBeInTheDocument();
	expect(console.error).not.toHaveBeenCalled();
});

it('stacks the four variants (R8)', () => {
	const { Stacked } = composeStories(variantsStories);

	render(<Stacked />);

	expect(screen.getByRole('listitem', { name: /Has anyone looked/ })).toHaveAttribute('aria-roledescription', 'message');
	expect(screen.getAllByRole('listitem').map((item) => item.getAttribute('aria-roledescription'))).toEqual([
		'message',
		'system message',
		'thread message',
		null,
	]);
	expect(screen.getByRole('link')).toHaveAttribute('aria-roledescription', 'thread message preview');
});

describe('the stories of the parts of a row', () => {
	const testCases = [...Object.values(composeStories(variantsStories)), ...Object.values(composeStories(rolesStories))].map((Story) => [
		Story.storyName || 'Story',
		Story,
	]);

	test.each(testCases)('%s should have no accessibility violations (R8)', async (_storyName, Story) => {
		const { container } = render(<Story />);

		expect(await axe(container)).toHaveNoViolations();
	});
});

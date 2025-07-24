import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './ThreadMessagePreviewBody.stories';

const { Default } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

jest.mock('../../../../lib/utils/fireGlobalEvent', () => ({
	fireGlobalEvent: jest.fn(),
}));

jest.mock('../../../../views/room/hooks/useGoToRoom', () => ({
	useGoToRoom: jest.fn(),
}));

test.each(testCases)(`renders ThreadMessagePreviewBody without crashing`, async (_storyname, Story) => {
	const view = render(<Story />, { wrapper: mockAppRoot().build() });

	expect(view.baseElement).toMatchSnapshot();
});

test.each(testCases)('ThreadMessagePreviewBody should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

	// Today we do not have exactly a pattern to handle menu cells that don't have a header
	const results = await axe(container);

	expect(results).toHaveNoViolations();
});

it('should not show an empty thread preview', async () => {
	const { container } = render(
		<Default
			message={{
				_id: 'message-id',
				ts: new Date(),
				msg: 'http://localhost:3000/group/ds?msg=ZoX9pDowqNb4BiWxf',
				md: [
					{
						type: 'PARAGRAPH',
						value: [
							{
								type: 'PLAIN_TEXT',
								value: 'message attachment text quote',
							},
						],
					},
				],
				attachments: [
					{
						text: 'message attachment text quote',
						md: [
							{
								type: 'PARAGRAPH',
								value: [
									{
										type: 'PLAIN_TEXT',
										value: 'message attachment text quote',
									},
								],
							},
						],
						message_link: 'http://localhost:3000/group/ds?msg=ZoX9pDowqNb4BiWxf',
						author_name: 'b',
						author_icon: '/avatar/b',
						attachments: [],
						ts: new Date('2025-07-24T18:05:45.339Z'),
					},
				],
				u: {
					_id: 'user-id',
					username: 'username',
				},
				rid: 'room-id',
				_updatedAt: new Date(),
			}}
		/>,
		{ wrapper: mockAppRoot().build() },
	);
	expect(container).toMatchSnapshot();
	const text = screen.getByText('http://localhost:3000/group/ds?msg=ZoX9pDowqNb4BiWxf');

	expect(text).toBeInTheDocument;
});

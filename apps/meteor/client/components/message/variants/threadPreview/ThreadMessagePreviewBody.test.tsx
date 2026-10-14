import { it, mock, test } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { expect } from 'expect';
import { axe } from 'jest-axe';
import type { FunctionLike } from 'jest-mock';
import { fn } from 'jest-mock';

mock.module('../../../../lib/utils/fireGlobalEvent', {
	exports: {
		fireGlobalEvent: fn<FunctionLike>(),
	},
});
mock.module('../../../../views/room/hooks/useGoToRoom', {
	exports: {
		useGoToRoom: fn<FunctionLike>(),
	},
});
const stories: typeof import('./ThreadMessagePreviewBody.stories') = require('./ThreadMessagePreviewBody.stories');

const { Default } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

testCases.forEach(([_storyname, Story]) => {
	test(`renders ThreadMessagePreviewBody without crashing`, async (t) => {
		const view = render(<Story />, { wrapper: mockAppRoot().build() });

		t.assert.snapshot(view.baseElement);
	});
});
testCases.forEach(([_storyname, Story]) => {
	test(`ThreadMessagePreviewBody should have no a11y violations`, async () => {
		const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

		const results = await axe(container);

		expect(results).toHaveNoViolations();
	});
});

it('should not show an empty thread preview', async (t) => {
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
	t.assert.snapshot(container);
	const text = screen.getByText('http://localhost:3000/group/ds?msg=ZoX9pDowqNb4BiWxf');

	expect(text).toBeInTheDocument;
});

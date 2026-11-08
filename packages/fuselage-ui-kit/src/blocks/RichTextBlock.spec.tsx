import { mockAppRoot } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen, waitFor } from '@testing-library/react';

import { messageParser } from '../surfaces';
import MessageSurface from '../surfaces/MessageSurface';

const wrapper = () =>
	mockAppRoot()
		.withEndpoint('GET', '/v1/users.info', ({ userId }: any) => ({ user: { _id: userId, username: `user-${userId}` } }) as any)
		.withEndpoint('GET', '/v1/teams.info', ({ teamId }: any) => ({ teamInfo: { _id: teamId, name: 'support' } }) as any)
		.withEndpoint('GET', '/v1/rooms.info', ({ roomId }: any) => ({ room: { _id: roomId, name: `room-${roomId}`, t: 'c' } }) as any)
		.build();

it('renders styled text, lists, quotes and code, and resolves mentions by id', async () => {
	render(
		<>
			{messageParser.render([
				{
					type: 'rich_text',
					elements: [
						{
							type: 'rich_text_section',
							elements: [
								{ type: 'text', text: 'Hello ', style: { bold: true } },
								{ type: 'user', user_id: 'u1' },
								{ type: 'text', text: ' in ' },
								{ type: 'channel', channel_id: 'c1' },
								{ type: 'text', text: ' ' },
								{ type: 'link', url: 'https://docs.rocket.chat', text: 'docs' },
							],
						},
						{
							type: 'rich_text_list',
							style: 'bullet',
							elements: [
								{ type: 'rich_text_section', elements: [{ type: 'text', text: 'first' }] },
								{ type: 'rich_text_section', elements: [{ type: 'text', text: 'second' }] },
							],
						},
						{ type: 'rich_text_quote', elements: [{ type: 'text', text: 'quoted' }] },
						{ type: 'rich_text_preformatted', elements: [{ type: 'text', text: 'let a = 1' }] },
					],
				},
			])}
		</>,
		{ wrapper: wrapper() },
	);

	await waitFor(() =>
		expect(screen.getByText('Hello', { exact: false }).parentElement).toHaveTextContent('Hello @user-u1 in #room-c1 docs'),
	);
	expect(screen.getByText('Hello')).toBeInTheDocument();
	expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['first', 'second']);
	expect(screen.getByText('quoted')).toBeInTheDocument();
	expect(document.querySelector('pre code')).toHaveTextContent('let a = 1');
	expect(screen.getByRole('link')).toHaveAttribute('href', 'https://docs.rocket.chat/');
});

it('shows the id of a mention until its name loads', () => {
	render(
		<>
			{messageParser.render([
				{ type: 'rich_text', elements: [{ type: 'rich_text_section', elements: [{ type: 'user', user_id: 'u1' }] }] },
			])}
		</>,
		{ wrapper: wrapper() },
	);

	expect(screen.getByText('u1', { exact: false }).parentElement).toHaveTextContent('@u1');
});

const section = (...elements: UiKit.RichTextInlineElement[]) =>
	messageParser.render([{ type: 'rich_text', elements: [{ type: 'rich_text_section', elements }] }]);

it('draws a tag between text runs without dropping the text', () => {
	render(
		<>{section({ type: 'text', text: 'Status ' }, { type: 'tag', text: 'In progress', color: 'red' }, { type: 'text', text: ' now' })}</>,
		{
			wrapper: wrapper(),
		},
	);

	expect(screen.getByText('In progress')).toBeInTheDocument();
	expect(screen.getByText('Status')).toBeInTheDocument();
	expect(screen.getByText('now')).toBeInTheDocument();
});

it('draws a citation as a link labelled with its index and named by its text', () => {
	render(
		<>
			{section({
				type: 'citation',
				url: 'https://example.com/source',
				text: 'Source title',
				index: 3,
				details: { citation_type: 'web', display_name: 'Example' },
			})}
		</>,
		{ wrapper: wrapper() },
	);

	const link = screen.getByRole('link', { name: '[3] Source title' });
	expect(link).toHaveTextContent('[3]');
	expect(link).toHaveAttribute('title', 'example.com \u2014 Source title');
	expect(link).toHaveAttribute('href', 'https://example.com/source');
});

it('names the host a protocol-relative citation opens, and keeps line breaks out of its labels', () => {
	render(<>{section({ type: 'citation', url: '//evil.com/x', text: 'Docs\nexample.com \u2014 trusted', index: 2 })}</>, {
		wrapper: wrapper(),
	});

	const link = screen.getByRole('link', { name: '[2] Docsexample.com \u2014 trusted' });

	expect(link).toHaveAttribute('title', 'evil.com \u2014 Docsexample.com \u2014 trusted');
});

it('draws a citation with an unsafe url as plain text', () => {
	render(<>{section({ type: 'citation', url: 'javascript:alert(1)', text: 'Source title', index: 3 })}</>, { wrapper: wrapper() });

	expect(screen.queryByRole('link')).not.toBeInTheDocument();
	expect(screen.getByText('[3]')).toBeInTheDocument();
});

it('resolves usergroup and team mentions by team id', async () => {
	render(<>{section({ type: 'usergroup', usergroup_id: 't1' }, { type: 'text', text: ' ' }, { type: 'team', team_id: 't1' })}</>, {
		wrapper: wrapper(),
	});

	await waitFor(() => expect(screen.getByText('support', { exact: false })).toHaveTextContent('@support #support'));
});

describe('requests', () => {
	const calls = { users: jest.fn(), rooms: jest.fn(), teams: jest.fn() };
	const countingWrapper = () =>
		mockAppRoot()
			.withEndpoint('GET', '/v1/users.info', ({ userId }: any) => {
				calls.users(userId);
				return { user: { _id: userId, username: `user-${userId}` } } as any;
			})
			.withEndpoint('GET', '/v1/teams.info', ({ teamId }: any) => {
				calls.teams(teamId);
				return { teamInfo: { _id: teamId, name: 'support' } } as any;
			})
			.withEndpoint('GET', '/v1/rooms.info', ({ roomId }: any) => {
				calls.rooms(roomId);
				return { room: { _id: roomId, name: `room-${roomId}`, t: 'c' } } as any;
			})
			.build();

	beforeEach(() => Object.values(calls).forEach((call) => call.mockClear()));

	it('asks for at most 20 users and teams and 5 rooms of a block, and for each room once', async () => {
		const many = (length: number) => Array.from({ length }, (_, index) => index);

		render(
			<>
				{section(
					...many(30).map((index): UiKit.RichTextInlineElement => ({ type: 'user', user_id: `u${index}` })),
					...many(30).map((index): UiKit.RichTextInlineElement => ({ type: 'channel', channel_id: `c${index}` })),
					...many(30).map((index): UiKit.RichTextInlineElement => ({ type: 'team', team_id: `t${index}` })),
				)}
			</>,
			{ wrapper: countingWrapper() },
		);

		await waitFor(() => expect(calls.teams).toHaveBeenCalledTimes(20));
		expect(calls.users).toHaveBeenCalledTimes(20);
		expect(calls.rooms).toHaveBeenCalledTimes(5);
	});

	it('shares the 20 ids of a kind between all the rich texts of a surface', async () => {
		const users = (from: number): UiKit.RichTextInlineElement[] =>
			Array.from({ length: 12 }, (_, index) => ({ type: 'user', user_id: `u${from + index}` }));

		render(
			<MessageSurface>
				{section(...users(0))}
				{section(...users(12))}
			</MessageSurface>,
			{ wrapper: countingWrapper() },
		);

		await waitFor(() => expect(calls.users).toHaveBeenCalledTimes(20));
		expect(calls.users).not.toHaveBeenCalledWith('u23');
	});

	it('gives a surface a new budget when its blocks change', async () => {
		const users = (from: number) =>
			section(...Array.from({ length: 20 }, (_, index): UiKit.RichTextInlineElement => ({ type: 'user', user_id: `u${from + index}` })));
		const { rerender } = render(<MessageSurface>{users(0)}</MessageSurface>, { wrapper: countingWrapper() });

		await waitFor(() => expect(calls.users).toHaveBeenCalledTimes(20));

		rerender(<MessageSurface>{users(20)}</MessageSurface>);

		await waitFor(() => expect(calls.users).toHaveBeenCalledTimes(40));
	});

	it('builds message permalinks from one room request per room, with the message id encoded', async () => {
		render(
			<>
				{section(
					{ type: 'channel', channel_id: 'r1' },
					{ type: 'message_mention', message_id: 'm 1&x=1', channel_id: 'r1' },
					{ type: 'message_mention', message_id: 'm2', channel_id: 'r1' },
				)}
			</>,
			{ wrapper: countingWrapper() },
		);

		const link = await screen.findAllByRole('link');

		expect(link.map((item) => item.getAttribute('href'))).toEqual([
			expect.stringContaining('?msg=m%201%26x%3D1'),
			expect.stringContaining('?msg=m2'),
		]);
		expect(calls.rooms).toHaveBeenCalledTimes(1);
	});
});

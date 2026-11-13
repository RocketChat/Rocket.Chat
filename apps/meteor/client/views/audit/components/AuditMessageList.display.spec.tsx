import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { LayoutContext } from '@rocket.chat/ui-contexts';
import { RoomMessage } from '@rocket.chat/ui-message-list';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useContext } from 'react';
import type { ReactNode } from 'react';

import AuditMessageList from './AuditMessageList';
import { createFakeMessage, createFakeRoom } from '../../../../tests/mocks/data';
import { MessagesProvider } from '../../../providers/MessagesProvider';
import { Rooms } from '../../../stores';
import { RoomContext } from '../../../views/room/contexts/RoomContext';

jest.mock('../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));
jest.mock('../../../lib/utils/fireGlobalEvent', () => ({ fireGlobalEvent: () => undefined }));
jest.mock('../../../hooks/useUserRolesByScope', () => ({
	useUserRolesByScope: () => ({ workspaceRoles: [], roomRoles: [] }),
}));
jest.mock('../../../lib/meteorRuntimeConfig', () => ({
	...jest.requireActual('../../../lib/meteorRuntimeConfig'),
	getRootUrlPathPrefix: () => '/chat',
}));
jest.mock('../../../lib/settings', () => ({
	settings: { peek: (id: string) => ({ Site_Url: 'https://chat.example.com/chat' })[id] },
}));

const withImage = (props: Partial<IMessage> = {}) =>
	createFakeMessage({
		u: { _id: 'author', username: 'author', name: 'Author' },
		msg: 'file',
		attachments: [
			{
				type: 'file',
				title: 'file.png',
				title_link: '/file-upload/id/file.png',
				image_url: '/file-upload/id/file.png',
				image_alt: 'The image',
				image_dimensions: { width: 1000, height: 1000 },
			},
		] as IMessage['attachments'],
		...props,
	});

const audited = (props: Partial<IMessage>) => createFakeMessage({ u: { _id: 'author', username: 'author', name: 'Author' }, ...props });

it('highlights the words the viewer highlights and shows mentions with real names (R36)', () => {
	const message = audited({
		msg: 'say alpha to @alice',
		md: [
			{
				type: 'PARAGRAPH',
				value: [
					{ type: 'PLAIN_TEXT', value: 'say alpha to ' },
					{ type: 'MENTION_USER', value: { type: 'PLAIN_TEXT', value: 'alice' } },
				],
			},
		],
		mentions: [{ _id: 'alice-id', username: 'alice', name: 'Alice A', type: 'user' }],
	});

	render(<AuditMessageList messages={[message]} />, {
		wrapper: mockAppRoot().withJohnDoe().withSetting('UI_Use_Real_Name', true).withUserPreference('highlights', ['alpha']).build(),
	});

	expect(screen.getByTitle('Highlighted_chosen_word')).toHaveTextContent('alpha');
	expect(screen.getByText('Alice A')).toBeInTheDocument();
});

it.each([
	[true, false],
	[false, true],
])("gives attachments the viewer's preferences when collapsing by default is %s (R38)", (collapseMediaByDefault, shown) => {
	render(<AuditMessageList messages={[withImage()]} />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withUserPreference('autoImageLoad', true)
			.withUserPreference('collapseMediaByDefault', collapseMediaByDefault)
			.build(),
	});

	expect(screen.queryByRole('img', { name: 'The image' }) !== null).toBe(shown);
});

it.each([
	[true, 'rgba(255, 0, 0, 100%)'],
	[false, 'color:#ff0000'],
])("parses a message without stored markdown with the viewer's hex color setting %s (R37)", (colors, expected) => {
	render(<AuditMessageList messages={[audited({ msg: 'color:#ff0000', md: undefined })]} />, {
		wrapper: mockAppRoot().withJohnDoe().withSetting('HexColorPreview_Enabled', colors).build(),
	});

	expect(screen.getByText(expected, { exact: false })).toBeInTheDocument();
});

it.each([
	[true, false],
	[false, true],
])("parses a message without stored markdown with the viewer's KaTeX setting %s (R37)", async (enabled, shownAsWritten) => {
	render(<AuditMessageList messages={[audited({ msg: '\\(x^2\\)', md: undefined })]} />, {
		wrapper: mockAppRoot().withJohnDoe().withSetting('Katex_Enabled', enabled).withSetting('Katex_Parenthesis_Syntax', true).build(),
	});

	expect(screen.queryByText('\\(x^2\\)', { exact: false }) !== null).toBe(shownAsWritten);

	await act(async () => undefined);
});

it('sizes attachments and resolves their URLs as the lists do (R38)', () => {
	render(<AuditMessageList messages={[withImage()]} />, {
		wrapper: mockAppRoot().withJohnDoe().withUserPreference('autoImageLoad', true).build(),
	});

	const image = screen.getByRole('img', { name: 'The image' });

	expect(image).toHaveAttribute('src', 'https://chat.example.com/chat/file-upload/id/file.png');
	expect(image).toHaveAttribute('width', '360');
	expect(image).toHaveAttribute('height', '360');
});

it.each([
	[true, true],
	[false, false],
])("loads an image at once only when the viewer's preferences say so: autoImageLoad %s (R38)", (autoImageLoad, loaded) => {
	render(<AuditMessageList messages={[withImage()]} />, {
		wrapper: mockAppRoot().withJohnDoe().withUserPreference('autoImageLoad', autoImageLoad).build(),
	});

	expect(screen.queryByRole('img', { name: 'The image' }) !== null).toBe(loaded);
	expect(screen.queryByText('Click_to_load') !== null).toBe(!loaded);
});

const OnMobile = ({ children }: { children?: ReactNode }) => {
	const layout = useContext(LayoutContext);

	return <LayoutContext.Provider value={{ ...layout, isMobile: true }}>{children}</LayoutContext.Provider>;
};

it.each([
	[true, true, false],
	[true, false, true],
	[false, true, true],
])(
	'loads an image at once unless the viewer saves mobile bandwidth on a mobile layout: saving %s, mobile %s (R38)',
	(saveMobileBandwidth, mobile, loaded) => {
		const root = mockAppRoot()
			.withJohnDoe()
			.withUserPreference('autoImageLoad', true)
			.withUserPreference('saveMobileBandwidth', saveMobileBandwidth);

		render(<AuditMessageList messages={[withImage()]} />, {
			wrapper: (mobile ? root.wrap((children: ReactNode) => <OnMobile>{children}</OnMobile>) : root).build(),
		});

		expect(screen.queryByRole('img', { name: 'The image' }) !== null).toBe(loaded);
	},
);

it('shows the attachments of an audited message without a toolbar (message-attachments R22)', () => {
	render(<AuditMessageList messages={[withImage()]} />, {
		wrapper: mockAppRoot().withJohnDoe().withUserPreference('autoImageLoad', true).build(),
	});

	expect(screen.getByRole('img', { name: 'The image' })).toBeInTheDocument();
	expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
});

describe('the toolbar of a message', () => {
	const room = createFakeRoom({ _id: 'audited-room', t: 'c' });

	beforeAll(() => {
		window.DISABLE_ANIMATION = true;
		global.IntersectionObserver = class {
			observe = jest.fn();

			disconnect = jest.fn();
		} as never;
	});

	beforeEach(() => {
		Rooms.state.store(room);
	});

	afterEach(() => {
		Rooms.state.replaceAll([]);
	});

	it('shows none in the audit, on hover or on focus, while a place that allows interaction shows one (message-toolbar R26)', async () => {
		const interactive = audited({ _id: 'interactive', rid: room._id, msg: 'in the room' });
		const read = audited({ _id: 'audited', rid: room._id, msg: 'in the audit' });

		render(
			<>
				<RoomContext.Provider value={{ rid: room._id, room, subscribed: true }}>
					<MessagesProvider room={room}>
						<RoomMessage message={interactive} sequential={false} unread={false} mention={false} all={false} />
					</MessagesProvider>
				</RoomContext.Provider>
				<AuditMessageList messages={[read]} />
			</>,
			{ wrapper: mockAppRoot().withJohnDoe().build() },
		);

		const audit = screen.getByRole('listitem', { name: /in the audit/ });
		await userEvent.hover(audit);
		act(() => audit.focus());

		const toolbars = await screen.findAllByRole('toolbar', { name: 'Message_actions' });
		expect(toolbars).toHaveLength(1);
		expect(within(screen.getByRole('listitem', { name: /in the room/ })).getByRole('toolbar')).toBe(toolbars[0]);
	});
});

describe('the display settings of the viewer (message-variants R44)', () => {
	const read = audited({
		_id: 'read',
		msg: 'look https://rocket.chat',
		ts: new Date('2021-10-27T10:00:00.000Z'),
		unread: false,
		urls: [{ url: 'https://rocket.chat', meta: { ogTitle: 'Rocket.Chat home' } }],
	} as Partial<IMessage>);

	it('shows the time, the username next to the real name, the read receipt and the URL previews, and no toolbar (R44)', () => {
		render(<AuditMessageList messages={[read]} />, {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withSetting('UI_Use_Real_Name', true)
				.withSetting('Message_Read_Receipt_Enabled', true)
				.withSetting('API_Embed', true)
				.build(),
		});

		const row = screen.getByRole('listitem', { name: /look/ });
		expect(within(row).getByText('Author')).toBeInTheDocument();
		expect(within(row).getByText('@author')).toBeInTheDocument();
		expect(row.querySelector('.rcx-message-header__time')?.textContent).not.toBe('');
		expect(within(row).getByRole('status', { name: 'Message_viewed' })).toBeInTheDocument();
		expect(within(row).getByText('Rocket.Chat home')).toBeInTheDocument();
		expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
	});

	it('leaves the username out when the viewer hides usernames (R44)', () => {
		render(<AuditMessageList messages={[read]} />, {
			wrapper: mockAppRoot().withJohnDoe().withSetting('UI_Use_Real_Name', true).withUserPreference('hideUsernames', true).build(),
		});

		expect(screen.queryByText('@author')).not.toBeInTheDocument();
	});

	it('shows no avatar when the viewer turned avatars off (R44, R46)', () => {
		render(<AuditMessageList messages={[read]} />, {
			wrapper: mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', false).build(),
		});

		expect(screen.queryByRole('figure')).not.toBeInTheDocument();
	});
});

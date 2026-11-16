import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useAttachmentDimensions, useAttachmentIsCollapsedByDefault, useMediaUrl } from '@rocket.chat/ui-contexts';
import { act, render, screen } from '@testing-library/react';

import AuditMessageList from './AuditMessageList';
import { createFakeMessage } from '../../../../tests/mocks/data';

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

const MockAttachmentsProbe = () => {
	const { width, height } = useAttachmentDimensions();
	const getURL = useMediaUrl();

	return (
		<>
			<span>{useAttachmentIsCollapsedByDefault() ? 'attachments collapsed' : 'attachments open'}</span>
			<span>{`${width}x${height} ${getURL('/file-upload/id/file.png')}`}</span>
		</>
	);
};

jest.mock('../../../components/message/content/Attachments', () => ({
	__esModule: true,
	default: () => <MockAttachmentsProbe />,
}));

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
	[true, 'attachments collapsed'],
	[false, 'attachments open'],
])("gives attachments the viewer's preferences when collapsing by default is %s (R38)", (collapseMediaByDefault, expected) => {
	render(<AuditMessageList messages={[audited({ msg: 'file' })]} />, {
		wrapper: mockAppRoot().withJohnDoe().withUserPreference('collapseMediaByDefault', collapseMediaByDefault).build(),
	});

	expect(screen.getByText(expected)).toBeInTheDocument();
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
	render(<AuditMessageList messages={[audited({ msg: 'file' })]} />, { wrapper: mockAppRoot().withJohnDoe().build() });

	expect(screen.getByText('360x360 https://chat.example.com/chat/file-upload/id/file.png')).toBeInTheDocument();
});

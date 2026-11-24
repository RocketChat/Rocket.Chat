import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import MessageHeaderRoles from './MessageHeaderRoles';
import { createFakeMessage } from '../../../../tests/mocks/data';
import type { MessageListContextValue } from '../list/MessageListContext';
import { MessageListContext, messageListContextDefaultValue } from '../list/MessageListContext';

jest.mock('./MessageHeaderRolesByScope', () => ({
	__esModule: true,
	default: () => <span>roles by scope</span>,
}));

const rid = 'room-1';

const withListRoles = (userRoles: MessageListContextValue['userRoles']) => {
	const value = { ...messageListContextDefaultValue, userRoles };
	return mockAppRoot()
		.wrap((children: ReactNode) => <MessageListContext.Provider value={value}>{children}</MessageListContext.Provider>)
		.build();
};

const listRoles = (labels: { workspaceRoles: string[]; roomRoles: string[] }) => ({ rid, get: () => labels });

it("shows the author's roles resolved by the message list", () => {
	const get = jest.fn(() => ({ workspaceRoles: ['Admin'], roomRoles: ['Owner'] }));
	const message = createFakeMessage({ rid });
	render(<MessageHeaderRoles message={message} />, { wrapper: withListRoles({ rid, get }) });

	expect(get).toHaveBeenCalledWith(message.u._id);
	expect(screen.getByText('Admin')).toBeInTheDocument();
	expect(screen.getByText('Owner')).toBeInTheDocument();
	expect(screen.queryByText('roles by scope')).not.toBeInTheDocument();
});

it('renders nothing for an author without roles who is not a bot', () => {
	const { container } = render(<MessageHeaderRoles message={createFakeMessage({ rid, bot: undefined })} />, {
		wrapper: withListRoles(listRoles({ workspaceRoles: [], roomRoles: [] })),
	});

	expect(container).toBeEmptyDOMElement();
});

it('tags a bot author even without roles', () => {
	render(<MessageHeaderRoles message={createFakeMessage({ rid, bot: { i: 'bot-id' } })} />, {
		wrapper: withListRoles(listRoles({ workspaceRoles: [], roomRoles: [] })),
	});

	expect(screen.getByText('Bot')).toBeInTheDocument();
});

it("resolves the author's roles itself when the list does not resolve them for the message's room", () => {
	render(<MessageHeaderRoles message={createFakeMessage({ rid: 'another-room' })} />, {
		wrapper: withListRoles(listRoles({ workspaceRoles: ['Admin'], roomRoles: [] })),
	});

	expect(screen.getByText('roles by scope')).toBeInTheDocument();
	expect(screen.queryByText('Admin')).not.toBeInTheDocument();
});

it("resolves the author's roles itself outside a message list", () => {
	render(<MessageHeaderRoles message={createFakeMessage({ rid })} />, { wrapper: mockAppRoot().build() });

	expect(screen.getByText('roles by scope')).toBeInTheDocument();
});

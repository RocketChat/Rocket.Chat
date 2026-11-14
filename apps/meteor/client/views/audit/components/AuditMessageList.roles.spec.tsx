import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen, waitFor } from '@testing-library/react';

import AuditMessageList from './AuditMessageList';
import { createFakeMessage } from '../../../../tests/mocks/data';

jest.mock('../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));

it('still renders the row of an audited message when the roles of its room cannot be fetched (message-variants R52)', async () => {
	const forbidden = jest.fn(() => {
		throw new Error('error-not-allowed');
	});
	const message = createFakeMessage({ rid: 'audited-room', msg: 'in the audit', u: { _id: 'author', username: 'author', name: 'Author' } });

	render(<AuditMessageList messages={[message]} />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('GET', '/v1/roles.getUsersInPublicRoles', () => ({ users: [] }))
			.withEndpoint('GET', '/v1/rooms.roles', forbidden)
			.build(),
	});

	await waitFor(() => expect(forbidden).toHaveBeenCalled());
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 50));
	});
	expect(screen.getByRole('listitem', { name: /in the audit/ })).toBeInTheDocument();
	expect(screen.queryByTitle(/_roles/)).not.toBeInTheDocument();
});

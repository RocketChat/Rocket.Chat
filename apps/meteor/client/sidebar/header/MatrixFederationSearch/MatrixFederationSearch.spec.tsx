import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VirtuosoMockContext } from 'react-virtuoso';

import MatrixFederationSearch from './MatrixFederationSearch';

jest.mock('../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {},
}));

const renderMatrixFederationSearch = (
	serverList = [
		{ name: `server-1`, default: true, local: false },
		{ name: `server-2`, default: false, local: false },
		{ name: `server-3`, default: false, local: false },
	],
) => {
	return render(<></>, {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/federation/listServersByUser', () => ({
				servers: serverList,
			}))
			.withEndpoint('GET', '/v1/federation/searchPublicRooms', ({ serverName, roomName, count }) => ({
				rooms: Array.from({ length: count || 100 }, (_, index) => ({
					id: `Matrix${index}`,
					name: `${roomName || 'Matrix'}${index + 1}`,
					canJoin: true,
					canonicalAlias: `#${serverName}:matrix.org`,
					joinedMembers: 44461,
					topic:
						'The Official Matrix HQ - chat about Matrix here! | https://matrix.org | https://spec.matrix.org | To support Matrix.org development: https://patreon.com/matrixdotorg | Code of Conduct: https://matrix.org/legal/code-of-conduct/ | This is an English speaking room | The Official Matrix HQ - chat about Matrix here! | https://matrix.org | https://spec.matrix.org | To support Matrix.org development: https://patreon.com/matrixdotorg | Code of Conduct: https://matrix.org/legal/code-of-conduct/ | This is an English speaking room The Official Matrix HQ - chat about Matrix here! | https://matrix.org | https://spec.matrix.org | To support Matrix.org development: https://patreon.com/matrixdotorg | Code of Conduct: https://matrix.org/legal/code-of-conduct/ | This is an English speaking room | The Official Matrix HQ - chat about Matrix here! | https://matrix.org | https://spec.matrix.org | To support Matrix.org development: https://patreon.com/matrixdotorg | Code of Conduct: https://matrix.org/legal/code-of-conduct/ | This is an English speaking room',
				})),
				count: 1,
				total: 73080,
				nextPageToken: 'g6FtzZa3oXK+IUpkemFiTlVQUFh6bENKQWhFbDpmYWJyaWMucHVioWTD',
			}))
			.withEndpoint('POST', '/v1/federation/joinExternalPublicRoom', () => null)
			.withEndpoint('POST', '/v1/federation/addServerByUser', ({ serverName }) => {
				serverList.push({ name: serverName, default: false, local: false });
				return null;
			})
			.withEndpoint('POST', '/v1/federation/removeServerByUser', ({ serverName }) => {
				serverList = serverList.filter((server) => server.name !== serverName);
				return null;
			})
			.withOpenModal(<MatrixFederationSearch onClose={jest.fn()} />)
			.wrap((children) => (
				<VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 100 }}>{children}</VirtuosoMockContext.Provider>
			))
			.build(),
	});
};

const openManageServers = async () => {
	const manageServerLink = await screen.findByRole('button', { name: 'Manage_server_list' });
	await userEvent.click(manageServerLink);
};

it('should render Federated Room search modal', async () => {
	renderMatrixFederationSearch();

	expect(await screen.findByRole('dialog', { name: 'Federation_Federated_room_search' })).toBeInTheDocument();

	expect(await screen.findByRole('listitem', { name: 'Matrix1' }, { timeout: 2000 })).toBeInTheDocument(); // TODO: remove flakyness
	expect(await screen.findByRole('listitem', { name: 'Matrix2' })).toBeInTheDocument();
});

it('should search for rooms', async () => {
	renderMatrixFederationSearch();

	const input = await screen.findByRole('searchbox', { name: 'Search_rooms' });
	expect(input).toBeInTheDocument();
	await userEvent.type(input, 'NotMatrix');

	expect(await screen.findByRole('listitem', { name: 'NotMatrix1' }, { timeout: 2000 })).toBeInTheDocument(); // TODO: remove flakyness
	expect(await screen.findByRole('listitem', { name: 'NotMatrix2' })).toBeInTheDocument();
});

it('should close the modal when joining a room', async () => {
	renderMatrixFederationSearch();

	const firstListItem = await screen.findByRole('listitem', { name: 'Matrix1' });
	const joinButton = await within(firstListItem).findByRole('button', { name: 'Join' });

	await userEvent.click(joinButton);

	expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

// TODO: should be a unit test for `MatrixFederationAddServerModal`
describe('server management', () => {
	it('should open the manage server modal', async () => {
		renderMatrixFederationSearch();

		await openManageServers();

		expect(await screen.findByRole('dialog', { name: 'Manage_servers' })).toBeInTheDocument();

		expect(await screen.findByText('server-1')).toBeInTheDocument();
		expect(await screen.findByText('server-2')).toBeInTheDocument();
		expect(await screen.findByText('server-3')).toBeInTheDocument();
	});

	it('should return to the Search modal when clicking cancel', async () => {
		renderMatrixFederationSearch();

		await openManageServers();

		const cancelButton = await screen.findByRole('button', { name: 'Cancel' });
		await userEvent.click(cancelButton);

		expect(await screen.findByRole('dialog', { name: 'Federation_Federated_room_search' })).toBeInTheDocument();
	});

	it('should return to the Search modal with the new server selected', async () => {
		renderMatrixFederationSearch();

		await openManageServers();

		const input = await screen.findByRole('textbox', { name: 'Server_name' });
		await userEvent.type(input, 'server-4');

		const addButton = await screen.findByRole('button', { name: 'Add' });
		await userEvent.click(addButton);

		expect(await screen.findByRole('dialog', { name: 'Federation_Federated_room_search' })).toBeInTheDocument();
		expect(await screen.findByRole('button', { name: 'server-4' })).toBeInTheDocument();
	});

	it('should remove servers from the list', async () => {
		renderMatrixFederationSearch([
			{ name: `server-1`, default: true, local: false },
			{ name: `server-2`, default: false, local: false },
			{ name: `server-3`, default: false, local: false },
			{ name: `server-4`, default: false, local: false },
		]);

		await openManageServers();

		const defaultItem = await screen.findByRole('listitem', { name: 'server-1' });
		await userEvent.hover(defaultItem);
		expect(within(defaultItem).queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();

		const lastItem = await screen.findByRole('listitem', { name: 'server-4' });
		await userEvent.hover(lastItem);
		const removeButton = await within(lastItem).findByRole('button', { name: 'Remove' });
		await userEvent.click(removeButton);

		expect(screen.queryByRole('listitem', { name: 'server-4' })).not.toBeInTheDocument();
	});
});

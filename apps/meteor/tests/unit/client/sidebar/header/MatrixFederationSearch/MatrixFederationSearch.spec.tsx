import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import type { ReactElement } from 'react';
import React from 'react';

const fetchRoomList = async ({ serverName, roomName, count }: any): Promise<any> => {
	return new Promise((resolve) =>
		resolve({
			rooms: Array.from({ length: count || 100 }).map((index) => ({
				id: `Matrix${index}`,
				name: `${roomName}${index}` || `Matrix${index}`,
				canJoin: true,
				canonicalAlias: `#${serverName}:matrix.org`,
				joinedMembers: 44461,
				topic:
					'The Official Matrix HQ - chat about Matrix here! | https://matrix.org | https://spec.matrix.org | To support Matrix.org development: https://patreon.com/matrixdotorg | Code of Conduct: https://matrix.org/legal/code-of-conduct/ | This is an English speaking room | The Official Matrix HQ - chat about Matrix here! | https://matrix.org | https://spec.matrix.org | To support Matrix.org development: https://patreon.com/matrixdotorg | Code of Conduct: https://matrix.org/legal/code-of-conduct/ | This is an English speaking room The Official Matrix HQ - chat about Matrix here! | https://matrix.org | https://spec.matrix.org | To support Matrix.org development: https://patreon.com/matrixdotorg | Code of Conduct: https://matrix.org/legal/code-of-conduct/ | This is an English speaking room | The Official Matrix HQ - chat about Matrix here! | https://matrix.org | https://spec.matrix.org | To support Matrix.org development: https://patreon.com/matrixdotorg | Code of Conduct: https://matrix.org/legal/code-of-conduct/ | This is an English speaking room',
			})),
			count: 1,
			total: 73080,
			nextPageToken: 'g6FtzZa3oXK+IUpkemFiTlVQUFh6bENKQWhFbDpmYWJyaWMucHVioWTD',
			prevPageToken: 'g6FtzYqIoXK+IWNOd2pkUXdWcFJNc0lNa1VweDptYXRyaXgub3JnoWTC',
			success: true,
		}),
	);
};

const joinExternalPublicRoom: any = async () => ({ success: true });

let serverList = [
	{ name: `server-1`, default: true, local: false },
	{ name: `server-2`, default: false, local: false },
	{ name: `server-3`, default: false, local: false },
];

const fetchServerList = async () => ({
	servers: serverList,
});

const removeMatrixServer: any = async ({ serverName }: any) => {
	serverList = serverList.filter((server) => server.name !== serverName);
};
const addMatrixServer: any = async ({ serverName }: any) => serverList.push({ name: serverName, default: false, local: false });

const COMPONENT_PATH = '../../../../../../client/sidebar/header/MatrixFederationSearch';

const defaultConfig = {
	'@rocket.chat/ui-contexts': {
		'useSetModal': () => (modal: ReactElement) => {
			cleanup();
			if (!modal) {
				return;
			}
			render(modal);
		},
		'@global': true,
	},
	'../../../lib/rooms/roomCoordinator': {
		'@noCallThru': true,
		'@global': true,
		'roomCoordinator': {
			openRouteLink: () => null,
		},
	},
};
const { makeCallEndpoint } = proxyquire.load('../../../../../mocks/client/ServerProviderMock', defaultConfig);

const [callEndpoint, registerEndpoint] = makeCallEndpoint();

registerEndpoint('GET', '/v1/federation/listServersByUser', fetchServerList);
registerEndpoint('GET', '/v1/federation/searchPublicRooms', fetchRoomList);
registerEndpoint('GET', '/v1/federation/joinExternalPublicRoom', joinExternalPublicRoom);
registerEndpoint('POST', '/v1/federation/addServerByUser', addMatrixServer);
registerEndpoint('POST', '/v1/federation/removeServerByUser', removeMatrixServer);

const openManageServers = () => {
	const manageServerLink = screen.getByRole('a');
	expect(manageServerLink).to.exist;
	userEvent.click(manageServerLink);
	expect(screen.getByRole('dialog')).to.exist;
	expect(screen.getByText('Manage servers')).to.exist;
};

const renderMatrixFederationSearch = () => {
	const MatrixFederationSearch = proxyquire.load(COMPONENT_PATH, defaultConfig).default;
	const ServerProviderMock = proxyquire.load('../../../../../mocks/client/ServerProviderMock', defaultConfig).default;
	const QueryClientProviderMock = proxyquire.load(
		'../../../../../../client/stories/contexts/QueryClientProviderMock',
		defaultConfig,
	).default;

	render(
		<ServerProviderMock callEndpoint={callEndpoint}>
			<QueryClientProviderMock>
				<MatrixFederationSearch />
			</QueryClientProviderMock>
		</ServerProviderMock>,
	);
};

describe.skip('sidebar/header/MatrixFederationSearch', () => {
	it('should render Federated Room search modal', async () => {
		renderMatrixFederationSearch();

		expect(screen.getByRole('dialog')).to.exist;
		expect(screen.getByText('Federated room search')).to.exist;
		expect(screen.getByText('Matrix1')).to.exist;
		expect(screen.getByText('Matrix2')).to.exist;
	});

	it('should search for rooms', async () => {
		renderMatrixFederationSearch();

		const input = screen.getByPlaceholderText('Search rooms');
		expect(input).to.exist;
		userEvent.type(input, 'NotMatrix');
		expect(screen.getByText('NotMatrix1')).to.exist;
		expect(screen.getByText('NotMatrix2')).to.exist;
	});

	it('should close the modal when joining a room', async () => {
		renderMatrixFederationSearch();

		const firstListItem = screen.getByRole('li', { name: 'Matrix1' });
		expect(firstListItem).to.exist;
		const joinButton = within(firstListItem).getByRole('button');
		expect(joinButton).to.exist;
		userEvent.click(joinButton);
		expect(screen.getByRole('dialog')).to.not.exist;
	});

	it('should open the manage server modal', async () => {
		renderMatrixFederationSearch();

		openManageServers();
		serverList.forEach((server) => {
			expect(screen.getByText(server.name)).to.exist;
		});
	});

	it('should return to the Search modal when clicking cancel', async () => {
		renderMatrixFederationSearch();

		openManageServers();

		const cancelButton = screen.getByText('Cancel');
		expect(cancelButton).to.exist;
		userEvent.click(cancelButton);

		expect(screen.getByRole('dialog')).to.exist;
		expect(screen.getByText('Federated room search')).to.exist;
	});

	it('should return to the Search modal with the new server selected', async () => {
		renderMatrixFederationSearch();

		openManageServers();

		const input = screen.getByRole('input');
		expect(input).to.exist;
		userEvent.type(input, 'server-4');

		const addButton = screen.getByText('Add');
		expect(addButton).to.exist;
		userEvent.click(addButton);

		expect(screen.getByRole('dialog')).to.exist;
		expect(screen.getByText('Federated room search')).to.exist;
		expect(screen.getByText('server-4')).to.be.visible;
	});

	it('should remove servers from the list', async () => {
		renderMatrixFederationSearch();

		openManageServers();

		const defaultItem = screen.getByTitle('server-1');
		expect(defaultItem).to.exist;
		userEvent.hover(defaultItem);
		expect(within(defaultItem).getByRole('i')).to.not.exist;

		const lastItem = screen.getByTitle('server-4');
		expect(lastItem).to.exist;
		userEvent.hover(lastItem);
		const removeButton = within(lastItem).getByRole('i');
		expect(removeButton).to.be.visible;
		userEvent.click(removeButton);

		expect(screen.getByText('server-4')).to.not.exist;
	});
});

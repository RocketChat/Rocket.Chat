import type { RocketChatFileAdapter } from '../../../../../server/services/federation/infrastructure/rocket-chat/adapters/File';
import type { RocketChatSettingsAdapter } from '../../../../../server/services/federation/infrastructure/rocket-chat/adapters/Settings';
import type { IFederationBridgeEE } from '../domain/IFederationBridge';
import type { RocketChatUserAdapterEE } from '../infrastructure/rocket-chat/adapters/User';
import { AbstractFederationApplicationServiceEE } from './AbstractFederationApplicationServiceEE';

const DEFAULT_SERVERS = [
	{
		name: 'matrix.org',
		default: true,
		local: false,
	},
	{
		name: 'gitter.im',
		default: true,
		local: false,
	},
	{
		name: 'libera.chat',
		default: true,
		local: false,
	},
];

export class FederationUserServiceEE extends AbstractFederationApplicationServiceEE {
	private readonly availableServers: { name: string; default: boolean; local: boolean }[];

	constructor(
		protected readonly internalSettingsAdapter: RocketChatSettingsAdapter,
		protected readonly internalFileAdapter: RocketChatFileAdapter,
		protected readonly internalUserAdapter: RocketChatUserAdapterEE,
		protected readonly bridge: IFederationBridgeEE,
	) {
		super(bridge, internalUserAdapter, internalFileAdapter, internalSettingsAdapter);
		this.availableServers = [
			{
				name: this.internalHomeServerDomain,
				default: true,
				local: true,
			},
			...DEFAULT_SERVERS,
		];
	}

	public async getSearchedServerNamesByInternalUserId(
		internalUserId: string,
	): Promise<{ name: string; default: boolean; local: boolean }[]> {
		if (!this.internalSettingsAdapter.isFederationEnabled()) {
			throw new Error('Federation is disabled');
		}

		const searchedServersByUser = await this.internalUserAdapter.getSearchedServerNamesByUserId(internalUserId);

		return [...this.availableServers, ...searchedServersByUser.map((server) => ({ name: server, default: false, local: false }))];
	}

	public async addSearchedServerNameByInternalUserId(internalUserId: string, serverName: string): Promise<void> {
		if (!this.internalSettingsAdapter.isFederationEnabled()) {
			throw new Error('Federation is disabled');
		}

		if (this.availableServers.some((server) => server.name === serverName)) {
			throw new Error('already-a-default-server');
		}

		await this.bridge.searchPublicRooms({
			serverName,
		});

		await this.internalUserAdapter.addServerNameToSearchedServerNamesListByUserId(internalUserId, serverName);
	}

	public async removeSearchedServerNameByInternalUserId(internalUserId: string, serverName: string): Promise<void> {
		if (!this.internalSettingsAdapter.isFederationEnabled()) {
			throw new Error('Federation is disabled');
		}

		if (this.availableServers.some((server) => server.name === serverName)) {
			throw new Error('cannot-remove-default-server');
		}

		const searchedServersByUser = await this.internalUserAdapter.getSearchedServerNamesByUserId(internalUserId);
		if (!searchedServersByUser.includes(serverName)) {
			throw new Error('server-not-found');
		}

		await this.internalUserAdapter.removeServerNameFromSearchedServerNamesListByUserId(internalUserId, serverName);
	}
}

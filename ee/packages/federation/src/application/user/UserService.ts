import { AbstractFederationApplicationService } from '../AbstractFederationApplicationService';
import type { IFederationBridge } from '../../domain/IFederationBridge';
import type { RocketChatUserAdapter } from '../../infrastructure/rocket-chat/adapters/User';
import type { RocketChatSettingsAdapter } from '../../infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatFileAdapter } from '../../infrastructure/rocket-chat/adapters/File';

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

export class FederationUserService extends AbstractFederationApplicationService {
	private readonly availableServers: { name: string; default: boolean; local: boolean }[];

	constructor(
		protected readonly internalSettingsAdapter: RocketChatSettingsAdapter,
		protected readonly internalFileAdapter: RocketChatFileAdapter,
		protected readonly internalUserAdapter: RocketChatUserAdapter,
		protected readonly bridge: IFederationBridge,
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

import type { IFederationBridge } from '../../domain/IFederationBridge';
import type { RocketChatFileAdapter } from '../../infrastructure/rocket-chat/adapters/File';
import type { RocketChatSettingsAdapter } from '../../infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatUserAdapter } from '../../infrastructure/rocket-chat/adapters/User';
import { AbstractFederationApplicationService } from '../AbstractFederationApplicationService';

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
	constructor(
		protected readonly internalSettingsAdapter: RocketChatSettingsAdapter,
		protected readonly internalFileAdapter: RocketChatFileAdapter,
		protected readonly internalUserAdapter: RocketChatUserAdapter,
		protected readonly bridge: IFederationBridge,
	) {
		super(bridge, internalUserAdapter, internalFileAdapter, internalSettingsAdapter);
	}

	private async getAvailableServers(): Promise<{ name: string; default: boolean; local: boolean }[]> {
		const internalHomeServerDomain = await this.internalSettingsAdapter.getHomeServerDomain();

		return [
			{
				name: internalHomeServerDomain,
				default: true,
				local: true,
			},
			...DEFAULT_SERVERS,
		];
	}

	public async getSearchedServerNamesByInternalUserId(
		internalUserId: string,
	): Promise<{ name: string; default: boolean; local: boolean }[]> {
		if (!(await this.internalSettingsAdapter.isFederationEnabled())) {
			throw new Error('Federation is disabled');
		}

		const searchedServersByUser = await this.internalUserAdapter.getSearchedServerNamesByUserId(internalUserId);

		return [
			...(await this.getAvailableServers()),
			...searchedServersByUser.map((server) => ({ name: server, default: false, local: false })),
		];
	}

	public async addSearchedServerNameByInternalUserId(internalUserId: string, serverName: string): Promise<void> {
		if (!(await this.internalSettingsAdapter.isFederationEnabled())) {
			throw new Error('Federation is disabled');
		}

		if ((await this.getAvailableServers()).some((server) => server.name === serverName)) {
			throw new Error('already-a-default-server');
		}

		await this.bridge.searchPublicRooms({
			serverName,
		});

		await this.internalUserAdapter.addServerNameToSearchedServerNamesListByUserId(internalUserId, serverName);
	}

	public async removeSearchedServerNameByInternalUserId(internalUserId: string, serverName: string): Promise<void> {
		if (!(await this.internalSettingsAdapter.isFederationEnabled())) {
			throw new Error('Federation is disabled');
		}

		if ((await this.getAvailableServers()).some((server) => server.name === serverName)) {
			throw new Error('cannot-remove-default-server');
		}

		const searchedServersByUser = await this.internalUserAdapter.getSearchedServerNamesByUserId(internalUserId);
		if (!searchedServersByUser.includes(serverName)) {
			throw new Error('server-not-found');
		}

		await this.internalUserAdapter.removeServerNameFromSearchedServerNamesListByUserId(internalUserId, serverName);
	}
}

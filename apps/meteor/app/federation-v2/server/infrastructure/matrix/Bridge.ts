import type { AppServiceOutput, Bridge } from '@rocket.chat/forked-matrix-appservice-bridge';

import type { IExternalUserProfileInformation, IFederationBridge } from '../../domain/IFederationBridge';
import { federationBridgeLogger } from '../rocket-chat/adapters/logger';
import type { AbstractMatrixEvent } from './definitions/AbstractMatrixEvent';
import { MatrixRoomType } from './definitions/MatrixRoomType';
import { MatrixRoomVisibility } from './definitions/MatrixRoomVisibility';

let MatrixUserInstance: any;

interface IRegistrationFileNamespaceRule {
	exclusive: boolean;
	regex: string;
}

interface IRegistrationFileNamespaces {
	users: IRegistrationFileNamespaceRule[];
	rooms: IRegistrationFileNamespaceRule[];
	aliases: IRegistrationFileNamespaceRule[];
}

export interface IFederationBridgeRegistrationFile {
	id: string;
	homeserverToken: string;
	applicationServiceToken: string;
	bridgeUrl: string;
	botName: string;
	listenTo: IRegistrationFileNamespaces;
}

export class MatrixBridge implements IFederationBridge {
	protected bridgeInstance: Bridge;

	protected isRunning = false;

	protected isUpdatingBridgeStatus = false;

	constructor(
		protected appServiceId: string,
		protected homeServerUrl: string,
		protected homeServerDomain: string,
		protected bridgeUrl: string,
		protected bridgePort: number,
		protected homeServerRegistrationFile: IFederationBridgeRegistrationFile,
		protected eventHandler: (event: AbstractMatrixEvent) => void,
	) {} // eslint-disable-line no-empty-function

	public async onFederationAvailabilityChanged(enabled: boolean): Promise<void> {
		if (!enabled) {
			await this.stop();
			return;
		}
		await this.start();
	}

	public async start(): Promise<void> {
		if (this.isUpdatingBridgeStatus) {
			return;
		}
		this.isUpdatingBridgeStatus = true;
		try {
			await this.stop();
			await this.createInstance();

			if (!this.isRunning) {
				await this.bridgeInstance.run(this.bridgePort);
				this.isRunning = true;
			}
		} catch (e) {
			federationBridgeLogger.error('Failed to initialize the matrix-appservice-bridge.', e);
		} finally {
			this.isUpdatingBridgeStatus = false;
		}
	}

	public async stop(): Promise<void> {
		if (!this.isRunning) {
			return;
		}
		this.isRunning = false;
		// the http server might take some minutes to shutdown, and this promise can take some time to be resolved
		await this.bridgeInstance?.close();
	}

	public async getUserProfileInformation(externalUserId: string): Promise<IExternalUserProfileInformation | undefined> {
		try {
			const externalInformation = await this.bridgeInstance.getIntent(externalUserId).getProfileInfo(externalUserId);

			return {
				displayName: externalInformation.displayname || '',
			};
		} catch (err) {
			// no-op
		}
	}

	public async joinRoom(externalRoomId: string, externalUserId: string): Promise<void> {
		await this.bridgeInstance.getIntent(externalUserId).join(externalRoomId);
	}

	public async inviteToRoom(externalRoomId: string, externalInviterId: string, externalInviteeId: string): Promise<void> {
		try {
			await this.bridgeInstance.getIntent(externalInviterId).invite(externalRoomId, externalInviteeId);
		} catch (e) {
			// no-op
		}
	}

	public async createUser(username: string, name: string, domain: string): Promise<string> {
		if (!MatrixUserInstance) {
			throw new Error('Error loading the Matrix User instance from the external library');
		}
		const matrixUserId = `@${username?.toLowerCase()}:${domain}`;
		const newUser = new MatrixUserInstance(matrixUserId);
		await this.bridgeInstance.provisionUser(newUser, { name: `${username} (${name})` });

		return matrixUserId;
	}

	public async createDirectMessageRoom(
		externalCreatorId: string,
		externalInviteeIds: string[],
		extraData: Record<string, any> = {},
	): Promise<string> {
		const intent = this.bridgeInstance.getIntent(externalCreatorId);

		const visibility = MatrixRoomVisibility.PRIVATE;
		const preset = MatrixRoomType.PRIVATE;
		const matrixRoom = await intent.createRoom({
			createAsClient: true,
			options: {
				visibility,
				preset,
				is_direct: true,
				invite: externalInviteeIds,
				creation_content: {
					was_internally_programatically_created: true,
					...extraData,
				},
			},
		});
		return matrixRoom.room_id;
	}

	public async sendMessage(externalRoomId: string, externaSenderId: string, text: string): Promise<void> {
		try {
			await this.bridgeInstance.getIntent(externaSenderId).sendText(externalRoomId, text);
		} catch (e) {
			throw new Error('User is not part of the room.');
		}
	}

	public isUserIdFromTheSameHomeserver(externalUserId: string, domain: string): boolean {
		const userDomain = this.extractHomeserverOrigin(externalUserId);

		return userDomain === domain;
	}

	public extractHomeserverOrigin(externalUserId: string): string {
		return externalUserId.includes(':') ? externalUserId.split(':').pop() || '' : this.homeServerDomain;
	}

	public isRoomFromTheSameHomeserver(externalRoomId: string, domain: string): boolean {
		return this.isUserIdFromTheSameHomeserver(externalRoomId, domain);
	}

	public logFederationStartupInfo(info?: string): void {
		federationBridgeLogger.info(`${info}:
			id: ${this.appServiceId}
			bridgeUrl: ${this.bridgeUrl}
			homeserverURL: ${this.homeServerUrl}
			homeserverDomain: ${this.homeServerDomain}
		`);
	}

	public async leaveRoom(externalRoomId: string, externalUserId: string): Promise<void> {
		try {
			await this.bridgeInstance.getIntent(externalUserId).leave(externalRoomId);
		} catch (e) {
			// no-op
		}
	}

	public async kickUserFromRoom(externalRoomId: string, externalUserId: string, externalOwnerId: string): Promise<void> {
		await this.bridgeInstance.getIntent(externalOwnerId).kick(externalRoomId, externalUserId);
	}

	protected async createInstance(): Promise<void> {
		federationBridgeLogger.info('Performing Dynamic Import of matrix-appservice-bridge');

		// Dynamic import to prevent Rocket.Chat from loading the module until needed and then handle if that fails
		const { Bridge, AppServiceRegistration, MatrixUser } = await import('@rocket.chat/forked-matrix-appservice-bridge');
		MatrixUserInstance = MatrixUser;

		this.bridgeInstance = new Bridge({
			homeserverUrl: this.homeServerUrl,
			domain: this.homeServerDomain,
			registration: AppServiceRegistration.fromObject(this.convertRegistrationFileToMatrixFormat()),
			disableStores: true,
			controller: {
				onEvent: async (request): Promise<void> => {
					const event = request.getData() as unknown as AbstractMatrixEvent;
					this.eventHandler(event);
				},
				onLog: async (line, isError): Promise<void> => {
					console.log(line, isError);
				},
			},
		});
	}

	private convertRegistrationFileToMatrixFormat(): AppServiceOutput {
		return {
			id: this.homeServerRegistrationFile.id,
			hs_token: this.homeServerRegistrationFile.homeserverToken,
			as_token: this.homeServerRegistrationFile.applicationServiceToken,
			url: this.homeServerRegistrationFile.bridgeUrl,
			sender_localpart: this.homeServerRegistrationFile.botName,
			namespaces: this.homeServerRegistrationFile.listenTo,
		};
	}
}

import { AppServiceOutput, Bridge } from '@rocket.chat/forked-matrix-appservice-bridge';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { IFederationBridge } from '../../domain/IFederationBridge';
import { bridgeLogger } from '../rocket-chat/adapters/logger';
import { IMatrixEvent } from './definitions/IMatrixEvent';
import { MatrixEventType } from './definitions/MatrixEventType';

export class MatrixBridge implements IFederationBridge {
	private bridgeInstance: Bridge;

	private isRunning = false;

	constructor(
		private appServiceId: string,
		private homeServerUrl: string,
		private homeServerDomain: string,
		private bridgeUrl: string,
		private bridgePort: number,
		private homeServerRegistrationFile: Record<string, any>,
		private eventHandler: Function,
	) {
		this.logInfo();
	}

	public async onFederationAvailabilityChanged(enabled: boolean): Promise<void> {
		if (!enabled) {
			await this.stop();
			return;
		}
		await this.start();
	}

	public async start(): Promise<void> {
		try {
			await this.stop();
			await this.createInstance();

			if (!this.isRunning) {
				await this.bridgeInstance.run(this.bridgePort);
				this.isRunning = true;
			}
		} catch (e) {
			bridgeLogger.error('Failed to initialize the matrix-appservice-bridge.', e);
			bridgeLogger.error('Disabling Matrix Bridge.  Please resolve error and try again');

			// await this.settingsAdapter.disableFederation();
		}
	}

	public async stop(): Promise<void> {
		if (!this.isRunning) {
			return;
		}
		// the http server might take some minutes to shutdown, and this promise can take some time to be resolved
		await this.bridgeInstance?.close();
		this.isRunning = false;
	}

	public async getUserProfileInformation(externalUserId: string): Promise<any> {
		try {
			return this.bridgeInstance.getIntent(externalUserId).getProfileInfo(externalUserId);
		} catch (err) {
			// no-op
		}
	}

	public async joinRoom(externalRoomId: string, externalUserId: string): Promise<void> {
		await this.bridgeInstance.getIntent(externalUserId).join(externalRoomId);
	}

	public async inviteToRoom(externalRoomId: string, externalInviterId: string, externalInviteeId: string): Promise<void> {
		await this.bridgeInstance.getIntent(externalInviterId).invite(externalRoomId, externalInviteeId);
	}

	public async createUser(username: string, name: string, domain: string): Promise<string> {
		const matrixUserId = `@${username?.toLowerCase()}:${domain}`;
		const intent = this.bridgeInstance.getIntent(matrixUserId);

		await intent.ensureProfile(name);
		await intent.setDisplayName(`${username} (${name})`);

		return matrixUserId;
	}

	public async createRoom(
		externalCreatorId: string,
		externalInviteeId: string,
		roomType: RoomType,
		roomName: string,
		roomTopic?: string,
	): Promise<string> {
		const intent = this.bridgeInstance.getIntent(externalCreatorId);

		const visibility = roomType === 'p' || roomType === 'd' ? 'invite' : 'public';
		const preset = roomType === 'p' || roomType === 'd' ? 'private_chat' : 'public_chat';

		// Create the matrix room
		const matrixRoom = await intent.createRoom({
			createAsClient: true,
			options: {
				name: roomName,
				topic: roomTopic,
				visibility,
				preset,
				...this.parametersForDirectMessagesIfNecessary(roomType, externalInviteeId),
				// eslint-disable-next-line @typescript-eslint/camelcase
				creation_content: {
					// eslint-disable-next-line @typescript-eslint/camelcase
					was_internally_programatically_created: true,
				},
			},
		});

		return matrixRoom.room_id;
	}

	public async sendMessage(externalRoomId: string, externaSenderId: string, text: string): Promise<void> {
		await this.bridgeInstance.getIntent(externaSenderId).sendText(externalRoomId, text);
	}

	public isUserIdFromTheSameHomeserver(externalUserId: string, domain: string): boolean {
		const userDomain = externalUserId.includes(':') ? externalUserId.split(':').pop() : '';

		return userDomain === domain;
	}

	public getInstance(): IFederationBridge {
		return this;
	}

	private parametersForDirectMessagesIfNecessary = (roomType: RoomType, invitedUserId: string): Record<string, any> => {
		return roomType === RoomType.DIRECT_MESSAGE
			? {
					// eslint-disable-next-line @typescript-eslint/camelcase
					is_direct: true,
					invite: [invitedUserId],
			  }
			: {};
	};

	private logInfo(): void {
		bridgeLogger.info(`Running Federation V2:
			id: ${this.appServiceId}
			bridgeUrl: ${this.bridgeUrl}
			homeserverURL: ${this.homeServerUrl}
			homeserverDomain: ${this.homeServerDomain}
		`);
	}

	private async createInstance(): Promise<void> {
		bridgeLogger.info('Performing Dynamic Import of matrix-appservice-bridge');

		// Dynamic import to prevent Rocket.Chat from loading the module until needed and then handle if that fails
		const { Bridge, AppServiceRegistration } = await import('@rocket.chat/forked-matrix-appservice-bridge');

		this.bridgeInstance = new Bridge({
			homeserverUrl: this.homeServerUrl,
			domain: this.homeServerDomain,
			registration: AppServiceRegistration.fromObject(this.homeServerRegistrationFile as AppServiceOutput),
			disableStores: true,
			controller: {
				onAliasQuery: (alias, matrixRoomId): void => {
					console.log('onAliasQuery', alias, matrixRoomId);
				},
				onEvent: async (request /* , context*/): Promise<void> => {
					// Get the event
					const event = request.getData() as unknown as IMatrixEvent<MatrixEventType>;
					this.eventHandler(event);
				},
				onLog: async (line, isError): Promise<void> => {
					console.log(line, isError);
				},
			},
		});
	}
}

import { AppServiceOutput, Bridge, MatrixUser } from '@rocket.chat/forked-matrix-appservice-bridge';

import { IFederationBridge } from '../../domain/IFederationBridge';
import { bridgeLogger } from '../rocket-chat/adapters/logger';
import { IMatrixEvent } from './definitions/IMatrixEvent';
import { RoomJoinRules } from './definitions/IMatrixEventContent/IMatrixEventContentSetRoomJoinRules';
import { MatrixEventType } from './definitions/MatrixEventType';
import { MatrixRoomType } from './definitions/MatrixRoomType';

export class MatrixBridge implements IFederationBridge {
	protected bridgeInstance: Bridge;

	protected isRunning = false;

	constructor(
		protected appServiceId: string,
		protected homeServerUrl: string,
		protected homeServerDomain: string,
		protected bridgeUrl: string,
		protected bridgePort: number,
		protected homeServerRegistrationFile: Record<string, any>,
		protected eventHandler: Function,
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

	public async getUserProfileInformation(externalUserId: string): Promise<any> {
		try {
			return await this.bridgeInstance.getIntent(externalUserId).getProfileInfo(externalUserId);
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
		const matrixUserId = `@${username?.toLowerCase()}:${domain}`;
		const newUser = new MatrixUser(matrixUserId);
		await this.bridgeInstance.provisionUser(newUser, { name: `${username} (${name})`});

		return matrixUserId;
	}

	public async createDirectMessageRoom(externalCreatorId: string, externalInviteeIds: string[]): Promise<string> {
		const intent = this.bridgeInstance.getIntent(externalCreatorId);

		const visibility = RoomJoinRules.INVITE;
		const preset = MatrixRoomType.PRIVATE;
		const matrixRoom = await intent.createRoom({
			createAsClient: true,
			options: {
				visibility,
				preset,
				// eslint-disable-next-line @typescript-eslint/camelcase
				is_direct: true,
				invite: externalInviteeIds,
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

	protected logInfo(): void {
		bridgeLogger.info(`Running Federation V2:
			id: ${this.appServiceId}
			bridgeUrl: ${this.bridgeUrl}
			homeserverURL: ${this.homeServerUrl}
			homeserverDomain: ${this.homeServerDomain}
		`);
	}

	public async leaveRoom(externalRoomId: string, externalUserId: string): Promise<void> {
		await this.bridgeInstance.getIntent(externalUserId).leave(externalRoomId);
	}

	protected async createInstance(): Promise<void> {
		bridgeLogger.info('Performing Dynamic Import of matrix-appservice-bridge');

		// Dynamic import to prevent Rocket.Chat from loading the module until needed and then handle if that fails
		const { Bridge, AppServiceRegistration } = await import('@rocket.chat/forked-matrix-appservice-bridge');

		this.bridgeInstance = new Bridge({
			homeserverUrl: this.homeServerUrl,
			domain: this.homeServerDomain,
			registration: AppServiceRegistration.fromObject(this.homeServerRegistrationFile as AppServiceOutput),
			disableStores: true,
			controller: {
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

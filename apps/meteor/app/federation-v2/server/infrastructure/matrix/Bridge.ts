import type { AppServiceOutput, Bridge } from '@rocket.chat/forked-matrix-appservice-bridge';

import { fetch } from '../../../../../server/lib/http/fetch';
import type { IExternalUserProfileInformation, IFederationBridge } from '../../domain/IFederationBridge';
import { federationBridgeLogger } from '../rocket-chat/adapters/logger';
import { convertEmojisRCFormatToMatrixFormat } from './converters/MessageReceiver';
import type { AbstractMatrixEvent } from './definitions/AbstractMatrixEvent';
import { MatrixEnumRelatesToRelType, MatrixEnumSendMessageType } from './definitions/events/RoomMessageSent';
import { MatrixEventType } from './definitions/MatrixEventType';
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
			await this.bridgeInstance.getIntent(externaSenderId).sendText(externalRoomId, this.escapeEmojis(text));
		} catch (e) {
			throw new Error('User is not part of the room.');
		}
	}

	private escapeEmojis(text: string): string {
		return convertEmojisRCFormatToMatrixFormat(text);
	}

	public async getReadStreamForFileFromUrl(externalUserId: string, fileUrl: string): Promise<ReadableStream> {
		const response = await fetch(this.convertMatrixUrlToHttp(externalUserId, fileUrl));
		if (!response.body) {
			throw new Error('Not able to download the file');
		}

		return response.body;
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

	public async redactEvent(externalRoomId: string, externalUserId: string, externalEventId: string): Promise<void> {
		await this.bridgeInstance.getIntent(externalUserId).matrixClient.redactEvent(externalRoomId, externalEventId);
	}

	public async sendMessageReaction(
		externalRoomId: string,
		externalUserId: string,
		externalEventId: string,
		reaction: string,
	): Promise<string> {
		const eventId = await this.bridgeInstance
			.getIntent(externalUserId)
			.matrixClient.sendEvent(externalRoomId, MatrixEventType.MESSAGE_REACTED, {
				'm.relates_to': {
					event_id: externalEventId,
					key: convertEmojisRCFormatToMatrixFormat(reaction),
					rel_type: 'm.annotation',
				},
			});

		return eventId;
	}

	public async updateMessage(
		externalRoomId: string,
		externalUserId: string,
		externalEventId: string,
		newMessageText: string,
	): Promise<void> {
		await this.bridgeInstance.getIntent(externalUserId).matrixClient.sendEvent(externalRoomId, MatrixEventType.ROOM_MESSAGE_SENT, {
			'body': ` * ${newMessageText}`,
			'm.new_content': {
				body: newMessageText,
				msgtype: MatrixEnumSendMessageType.TEXT,
			},
			'm.relates_to': {
				rel_type: MatrixEnumRelatesToRelType.REPLACE,
				event_id: externalEventId,
			},
			'msgtype': MatrixEnumSendMessageType.TEXT,
		});
	}

	public async sendMessageFileToRoom(
		externalRoomId: string,
		externaSenderId: string,
		content: Buffer,
		fileDetails: { filename: string; fileSize: number; mimeType: string; metadata?: { width?: number; height?: number; format?: string } },
	): Promise<void> {
		try {
			const mxcUrl = await this.bridgeInstance.getIntent(externaSenderId).uploadContent(content);
			await this.bridgeInstance.getIntent(externaSenderId).sendMessage(externalRoomId, {
				body: fileDetails.filename,
				filename: fileDetails.filename,
				info: {
					size: fileDetails.fileSize,
					mimetype: fileDetails.mimeType,
					...(fileDetails.metadata?.height && fileDetails.metadata?.width
						? { h: fileDetails.metadata?.height, w: fileDetails.metadata?.width }
						: {}),
				},
				msgtype: this.getMsgTypeBasedOnMimeType(fileDetails.mimeType),
				url: mxcUrl,
			});
		} catch (e: any) {
			if (e.body?.includes('413') || e.body?.includes('M_TOO_LARGE')) {
				throw new Error('File is too large');
			}
		}
	}

	private getMsgTypeBasedOnMimeType(mimeType: string): MatrixEnumSendMessageType {
		const knownImageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
		const knownAudioMimeTypes = ['audio/mpeg', 'audio/ogg', 'audio/wav'];
		const knownVideoMimeTypes = ['video/mp4', 'video/ogg', 'video/webm'];

		if (knownImageMimeTypes.includes(mimeType)) {
			return MatrixEnumSendMessageType.IMAGE;
		}
		if (knownAudioMimeTypes.includes(mimeType)) {
			return MatrixEnumSendMessageType.AUDIO;
		}
		if (knownVideoMimeTypes.includes(mimeType)) {
			return MatrixEnumSendMessageType.VIDEO;
		}
		return MatrixEnumSendMessageType.FILE;
	}

	public async uploadContent(
		externalSenderId: string,
		content: Buffer,
		options?: { name?: string; type?: string },
	): Promise<string | undefined> {
		try {
			const mxcUrl = await this.bridgeInstance.getIntent(externalSenderId).uploadContent(content, options);

			return mxcUrl;
		} catch (e: any) {
			if (e.body?.includes('413') || e.body?.includes('M_TOO_LARGE')) {
				throw new Error('File is too large');
			}
		}
	}

	public convertMatrixUrlToHttp(externalUserId: string, matrixUrl: string): string {
		return this.bridgeInstance.getIntent(externalUserId).matrixClient.mxcToHttp(matrixUrl);
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

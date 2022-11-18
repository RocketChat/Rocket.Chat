import type { IMessage } from '@rocket.chat/core-typings';
import type { AppServiceOutput, Bridge } from '@rocket.chat/forked-matrix-appservice-bridge';

import { fetch } from '../../../../../server/lib/http/fetch';
import type { IExternalUserProfileInformation, IFederationBridge, IFederationBridgeRegistrationFile } from '../../domain/IFederationBridge';
import { federationBridgeLogger } from '../rocket-chat/adapters/logger';
import { toExternalMessageFormat, toExternalQuoteMessageFormat } from './converters/MessageTextParser';
import { convertEmojisRCFormatToMatrixFormat } from './converters/MessageReceiver';
import type { AbstractMatrixEvent } from './definitions/AbstractMatrixEvent';
import { MatrixEnumRelatesToRelType, MatrixEnumSendMessageType } from './definitions/events/RoomMessageSent';
import { MatrixEventType } from './definitions/MatrixEventType';
import { MatrixRoomType } from './definitions/MatrixRoomType';
import { MatrixRoomVisibility } from './definitions/MatrixRoomVisibility';

let MatrixUserInstance: any;

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

	public async onFederationAvailabilityChanged(
		enabled: boolean,
		appServiceId: string,
		homeServerUrl: string,
		homeServerDomain: string,
		bridgeUrl: string,
		bridgePort: number,
		homeServerRegistrationFile: IFederationBridgeRegistrationFile,
	): Promise<void> {
		this.appServiceId = appServiceId;
		this.homeServerUrl = homeServerUrl;
		this.homeServerDomain = homeServerDomain;
		this.bridgeUrl = bridgeUrl;
		this.bridgePort = bridgePort;
		this.homeServerRegistrationFile = homeServerRegistrationFile;
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
		} catch (err) {
			federationBridgeLogger.error({ msg: 'Failed to initialize the matrix-appservice-bridge.', err });
		} finally {
			this.isUpdatingBridgeStatus = false;
		}
	}

	public async stop(): Promise<void> {
		if (!this.isRunning) {
			return;
		}
		return new Promise(async (resolve: () => void): Promise<void> => {
			// the http server might take some minutes to shutdown, and this promise can take some time to be resolved
			await this.bridgeInstance?.close();
			this.isRunning = false;
			resolve();
		});
	}

	public async getUserProfileInformation(externalUserId: string): Promise<IExternalUserProfileInformation | undefined> {
		try {
			const externalInformation = await this.bridgeInstance.getIntent(externalUserId).getProfileInfo(externalUserId, undefined, false);

			return {
				displayName: externalInformation.displayname || '',
				...(externalInformation.avatar_url
					? {
							avatarUrl: externalInformation.avatar_url,
					  }
					: {}),
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

	public async setUserAvatar(externalUserId: string, avatarUrl: string): Promise<void> {
		try {
			await this.bridgeInstance.getIntent(externalUserId).matrixClient.setAvatarUrl(avatarUrl);
		} catch (e) {
			// no-op
		}
	}

	public async createUser(username: string, name: string, domain: string, avatarUrl?: string): Promise<string> {
		if (!MatrixUserInstance) {
			throw new Error('Error loading the Matrix User instance from the external library');
		}
		const matrixUserId = `@${username?.toLowerCase()}:${domain}`;
		const newUser = new MatrixUserInstance(matrixUserId);
		await this.bridgeInstance.provisionUser(newUser, { name, ...(avatarUrl ? { url: avatarUrl } : {}) });

		return matrixUserId;
	}

	public async setUserDisplayName(externalUserId: string, displayName: string): Promise<void> {
		try {
			await this.bridgeInstance.getIntent(externalUserId).setDisplayName(displayName);
		} catch (e) {
			// no-op
		}
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

	public async sendMessage(externalRoomId: string, externalSenderId: string, message: IMessage): Promise<string> {
		try {
			const messageId = await this.bridgeInstance.getIntent(externalSenderId).matrixClient.sendHtmlText(
				externalRoomId,
				this.escapeEmojis(
					await toExternalMessageFormat({
						message: message.msg,
						externalRoomId,
						homeServerDomain: this.homeServerDomain,
					}),
				),
			);

			return messageId;
		} catch (e) {
			throw new Error('User is not part of the room.');
		}
	}

	public async sendReplyToMessage(
		externalRoomId: string,
		externalUserId: string,
		eventToReplyTo: string,
		originalEventSender: string,
		replyMessage: string,
	): Promise<string> {
		const { formattedMessage, message } = await toExternalQuoteMessageFormat({
			externalRoomId,
			eventToReplyTo,
			originalEventSender,
			message: this.escapeEmojis(replyMessage),
			homeServerDomain: this.homeServerDomain,
		});
		const messageId = await this.bridgeInstance
			.getIntent(externalUserId)
			.matrixClient.sendEvent(externalRoomId, MatrixEventType.ROOM_MESSAGE_SENT, {
				'body': message,
				'format': 'org.matrix.custom.html',
				'formatted_body': formattedMessage,
				'm.relates_to': {
					'm.in_reply_to': { event_id: eventToReplyTo },
				},
				'msgtype': MatrixEnumSendMessageType.TEXT,
			});

		return messageId;
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

	public async notifyUserTyping(externalRoomId: string, externalUserId: string, isTyping: boolean): Promise<void> {
		await this.bridgeInstance.getIntent(externalUserId).sendTyping(externalRoomId, isTyping);
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
		const messageInExternalFormat = this.escapeEmojis(
			await toExternalMessageFormat({ message: newMessageText, externalRoomId, homeServerDomain: this.homeServerDomain }),
		);

		await this.bridgeInstance.getIntent(externalUserId).matrixClient.sendEvent(externalRoomId, MatrixEventType.ROOM_MESSAGE_SENT, {
			'body': ` * ${newMessageText}`,
			'format': 'org.matrix.custom.html',
			'formatted_body': messageInExternalFormat,
			'm.new_content': {
				body: messageInExternalFormat,
				format: 'org.matrix.custom.html',
				formatted_body: messageInExternalFormat,
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
	): Promise<string> {
		try {
			const mxcUrl = await this.bridgeInstance.getIntent(externaSenderId).uploadContent(content);
			const { event_id: messageId } = await this.bridgeInstance.getIntent(externaSenderId).sendMessage(externalRoomId, {
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

			return messageId;
		} catch (e: any) {
			if (e.body?.includes('413') || e.body?.includes('M_TOO_LARGE')) {
				throw new Error('File is too large');
			}
			return '';
		}
	}

	public async sendReplyMessageFileToRoom(
		externalRoomId: string,
		externaSenderId: string,
		content: Buffer,
		fileDetails: { filename: string; fileSize: number; mimeType: string; metadata?: { width?: number; height?: number; format?: string } },
		eventToReplyTo: string,
	): Promise<string> {
		try {
			const mxcUrl = await this.bridgeInstance.getIntent(externaSenderId).uploadContent(content);
			const { event_id: messageId } = await this.bridgeInstance.getIntent(externaSenderId).sendMessage(externalRoomId, {
				'body': fileDetails.filename,
				'filename': fileDetails.filename,
				'info': {
					size: fileDetails.fileSize,
					mimetype: fileDetails.mimeType,
					...(fileDetails.metadata?.height && fileDetails.metadata?.width
						? { h: fileDetails.metadata?.height, w: fileDetails.metadata?.width }
						: {}),
				},
				'm.relates_to': {
					'm.in_reply_to': { event_id: eventToReplyTo },
				},
				'msgtype': this.getMsgTypeBasedOnMimeType(fileDetails.mimeType),
				'url': mxcUrl,
			});

			return messageId;
		} catch (e: any) {
			if (e.body?.includes('413') || e.body?.includes('M_TOO_LARGE')) {
				throw new Error('File is too large');
			}
			return '';
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
				...(this.homeServerRegistrationFile.enableEphemeralEvents
					? {
							onEphemeralEvent: async (request): Promise<void> => {
								const event = request.getData() as unknown as AbstractMatrixEvent;
								this.eventHandler(event);
							},
					  }
					: {}),
			},
		});
	}

	private convertRegistrationFileToMatrixFormat(): AppServiceOutput {
		return {
			'id': this.homeServerRegistrationFile.id,
			'hs_token': this.homeServerRegistrationFile.homeserverToken,
			'as_token': this.homeServerRegistrationFile.applicationServiceToken,
			'url': this.homeServerRegistrationFile.bridgeUrl,
			'sender_localpart': this.homeServerRegistrationFile.botName,
			'namespaces': this.homeServerRegistrationFile.listenTo,
			'de.sorunome.msc2409.push_ephemeral': this.homeServerRegistrationFile.enableEphemeralEvents,
		};
	}
}

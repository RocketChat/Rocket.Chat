import type { IMessage } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import type { AppServiceOutput, Bridge } from 'matrix-appservice-bridge';

import type { IExternalUserProfileInformation, IFederationBridge, IFederationBridgeRegistrationFile } from '../../domain/IFederationBridge';
import type { RocketChatSettingsAdapter } from '../rocket-chat/adapters/Settings';
import { federationBridgeLogger } from '../rocket-chat/adapters/logger';
import { convertEmojisFromRCFormatToMatrixFormat } from './converters/room/MessageReceiver';
import { formatExternalUserIdToInternalUsernameFormat } from './converters/room/RoomReceiver';
import { toExternalMessageFormat, toExternalQuoteMessageFormat } from './converters/room/to-internal-parser-formatter';
import type { AbstractMatrixEvent } from './definitions/AbstractMatrixEvent';
import { MatrixEventType } from './definitions/MatrixEventType';
import { MatrixRoomType } from './definitions/MatrixRoomType';
import { MatrixRoomVisibility } from './definitions/MatrixRoomVisibility';
import { RoomMembershipChangedEventType } from './definitions/events/RoomMembershipChanged';
import { MatrixEnumRelatesToRelType, MatrixEnumSendMessageType } from './definitions/events/RoomMessageSent';
import type { MatrixEventRoomNameChanged } from './definitions/events/RoomNameChanged';
import type { MatrixEventRoomTopicChanged } from './definitions/events/RoomTopicChanged';
import { HttpStatusCodes } from './helpers/HtttpStatusCodes';
import { extractUserIdAndHomeserverFromMatrixId } from './helpers/MatrixIdStringTools';
import { VerificationStatus, MATRIX_USER_IN_USE } from './helpers/MatrixIdVerificationTypes';

let MatrixUserInstance: any;

const DEFAULT_TIMEOUT_IN_MS_FOR_JOINING_ROOMS = 180000;

const DEFAULT_TIMEOUT_IN_MS_FOR_PING_EVENT = 60 * 1000;

export class MatrixBridge implements IFederationBridge {
	protected bridgeInstance: Bridge;

	protected isRunning = false;

	protected isUpdatingBridgeStatus = false;

	constructor(
		protected internalSettings: RocketChatSettingsAdapter,
		protected eventHandler: (event: AbstractMatrixEvent) => void,
	) {} // eslint-disable-line no-empty-function

	public async start(): Promise<void> {
		if (this.isUpdatingBridgeStatus) {
			return;
		}
		this.isUpdatingBridgeStatus = true;
		try {
			await this.stop();
			await this.createInstance();

			if (!this.isRunning) {
				await this.bridgeInstance.run(this.internalSettings.getBridgePort());

				this.bridgeInstance.addAppServicePath({
					method: 'POST',
					path: '/_matrix/app/v1/ping',
					authenticate: true,
					handler: (_req, res, _next) => {
						/*
						 * https://spec.matrix.org/v1.11/application-service-api/#post_matrixappv1ping
						 * Spec does not talk about what to do with the id. It is safe to ignore it as we are already checking for
						 * homeserver token to be correct.
						 * From the spec this might be a bit confusing, as it shows a txn id for post, but app service doing nothing with it afterwards
						 * when receiving from the homeserver.
						 * From spec directly -
							AS ---> HS : /_matrix/client/v1/appservice/{appserviceId}/ping {"transaction_id": "meow"}
								HS ---> AS : /_matrix/app/v1/ping {"transaction_id": "meow"}
								HS <--- AS : 200 OK {}
							AS <--- HS : 200 OK {"duration_ms": 123}
						 * https://github.com/matrix-org/matrix-spec/blob/e53e6ea8764b95f0bdb738549fca6f9f3f901298/content/application-service-api.md?plain=1#L229-L232
						 * Code - wise, also doesn't care what happens with the response.
						 * https://github.com/element-hq/synapse/blob/cb6f4a84a6a8f2b79b80851f37eb5fa4c7c5264a/synapse/rest/client/appservice_ping.py#L80 - nothing done on return
						 * https://github.com/element-hq/synapse/blob/cb6f4a84a6a8f2b79b80851f37eb5fa4c7c5264a/synapse/appservice/api.py#L321-L332 - not even returning the response, caring for just the http status code - https://github.com/element-hq/synapse/blob/cb6f4a84a6a8f2b79b80851f37eb5fa4c7c5264a/synapse/http/client.py#L532-L537
						 */
						res.status(200).json({});
					},
				});

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

	public async joinRoom(externalRoomId: string, externalUserId: string, viaServers?: string[]): Promise<void> {
		try {
			await this.bridgeInstance
				.getIntent(externalUserId)
				.matrixClient.doRequest(
					'POST',
					`/_matrix/client/v3/join/${externalRoomId}`,
					{ server_name: viaServers },
					{},
					DEFAULT_TIMEOUT_IN_MS_FOR_JOINING_ROOMS,
				);
		} catch (e) {
			throw new Error('Error joining Matrix room');
		}
	}

	public async getRoomHistoricalJoinEvents(
		externalRoomId: string,
		externalUserId: string,
		excludingUserIds: string[] = [],
	): Promise<any[]> {
		const events = await this.bridgeInstance.getIntent(externalUserId).matrixClient.getRoomState(externalRoomId);
		const roomCreator = events.find((event) => event.type === MatrixEventType.ROOM_CREATED)?.content?.creator;
		if (!roomCreator) {
			return [];
		}
		return events
			.filter(
				(event) =>
					event.type === MatrixEventType.ROOM_MEMBERSHIP_CHANGED &&
					event.content.membership === RoomMembershipChangedEventType.JOIN &&
					!excludingUserIds.includes(event.state_key),
			)
			.map((event) => ({
				...event,
				sender: roomCreator,
			}));
	}

	public async getRoomData(
		externalUserId: string,
		externalRoomId: string,
	): Promise<{ creator: { id: string; username: string }; name: string; joinedMembers: string[] } | undefined> {
		const includeEvents = ['join'];
		const excludeEvents = ['leave', 'ban'];
		const members = await this.bridgeInstance
			.getIntent(externalUserId)
			.matrixClient.getRoomMembers(externalRoomId, undefined, includeEvents as any[], excludeEvents as any[]);

		const joinedMembers = await this.bridgeInstance.getIntent(externalUserId).matrixClient.getJoinedRoomMembers(externalRoomId);

		const oldestFirst = members.sort((a, b) => a.timestamp - b.timestamp).shift();
		if (!oldestFirst) {
			return;
		}

		const roomName = await this.getRoomName(externalRoomId, externalUserId);
		if (!roomName) {
			return;
		}

		return {
			creator: {
				id: oldestFirst.sender,
				username: formatExternalUserIdToInternalUsernameFormat(oldestFirst.sender),
			},
			joinedMembers,
			name: roomName,
		};
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

	public async verifyInviteeIds(matrixIds: string[]): Promise<Map<string, string>> {
		const matrixIdVerificationMap = new Map();
		const matrixIdsVerificationPromises = matrixIds.map((matrixId) => this.verifyInviteeId(matrixId));
		const matrixIdsVerificationPromiseResponse = await Promise.allSettled(matrixIdsVerificationPromises);
		const matrixIdsVerificationFulfilledResults = matrixIdsVerificationPromiseResponse
			.filter((result): result is PromiseFulfilledResult<VerificationStatus> => result.status === 'fulfilled')
			.map((result) => result.value);

		matrixIds.forEach((matrixId, idx) => matrixIdVerificationMap.set(matrixId, matrixIdsVerificationFulfilledResults[idx]));
		return matrixIdVerificationMap;
	}

	private async verifyInviteeId(externalInviteeId: string): Promise<VerificationStatus> {
		const [userId, homeserverUrl] = extractUserIdAndHomeserverFromMatrixId(externalInviteeId);
		try {
			const response = await fetch(`https://${homeserverUrl}/_matrix/client/v3/register/available`, { params: { username: userId } });

			if (response.status === HttpStatusCodes.BAD_REQUEST) {
				const responseBody = await response.json();

				if (responseBody.errcode === MATRIX_USER_IN_USE) {
					return VerificationStatus.VERIFIED;
				}
			}

			if (response.status === HttpStatusCodes.OK) {
				return VerificationStatus.UNVERIFIED;
			}
		} catch (e) {
			return VerificationStatus.UNABLE_TO_VERIFY;
		}

		return VerificationStatus.UNABLE_TO_VERIFY;
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
		inviteesExternalIds: string[],
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
				invite: inviteesExternalIds,
				creation_content: {
					was_internally_programatically_created: true,
					...extraData,
					inviteesExternalIds,
				},
			},
		});
		return matrixRoom.room_id;
	}

	public async sendMessage(externalRoomId: string, externalSenderId: string, message: IMessage): Promise<string> {
		try {
			const messageId = await this.bridgeInstance
				.getIntent(externalSenderId)
				.matrixClient.sendRawEvent(externalRoomId, MatrixEventType.ROOM_MESSAGE_SENT, {
					msgtype: 'm.text',
					body: this.escapeEmojis(message.msg),
					formatted_body: this.escapeEmojis(
						await toExternalMessageFormat({
							message: message.msg,
							externalRoomId,
							homeServerDomain: this.internalSettings.getHomeServerDomain(),
						}),
					),
					format: 'org.matrix.custom.html',
				});

			return messageId;
		} catch (e) {
			throw new Error('User is not part of the room.');
		}
	}

	public async sendThreadMessage(
		externalRoomId: string,
		externalSenderId: string,
		message: IMessage,
		relatesToEventId: string,
	): Promise<string> {
		const text = this.escapeEmojis(
			await toExternalMessageFormat({
				message: message.msg,
				externalRoomId,
				homeServerDomain: this.internalSettings.getHomeServerDomain(),
			}),
		);
		const messageId = await this.bridgeInstance
			.getIntent(externalSenderId)
			.matrixClient.sendRawEvent(externalRoomId, MatrixEventType.ROOM_MESSAGE_SENT, {
				'msgtype': 'm.text',
				'body': this.escapeEmojis(message.msg),
				'formatted_body': text,
				'format': 'org.matrix.custom.html',
				'm.relates_to': {
					'rel_type': 'm.thread',
					'event_id': relatesToEventId,
					'is_falling_back': true,
					'm.in_reply_to': {
						event_id: relatesToEventId,
					},
				},
			});
		return messageId;
	}

	public async sendThreadReplyToMessage(
		externalRoomId: string,
		externalUserId: string,
		eventToReplyTo: string,
		originalEventSender: string,
		replyMessage: string,
		relatesToEventId: string,
	): Promise<string> {
		const { formattedMessage, message } = await toExternalQuoteMessageFormat({
			externalRoomId,
			eventToReplyTo,
			originalEventSender,
			message: this.escapeEmojis(replyMessage),
			homeServerDomain: this.internalSettings.getHomeServerDomain(),
		});
		const messageId = await this.bridgeInstance
			.getIntent(externalUserId)
			.matrixClient.sendRawEvent(externalRoomId, MatrixEventType.ROOM_MESSAGE_SENT, {
				'msgtype': 'm.text',
				'body': message,
				'format': 'org.matrix.custom.html',
				'formatted_body': formattedMessage,
				'm.relates_to': {
					'rel_type': 'm.thread',
					'event_id': relatesToEventId,
					'is_falling_back': false,
					'm.in_reply_to': {
						event_id: eventToReplyTo,
					},
				},
			});

		return messageId;
	}

	public async sendMessageFileToThread(
		externalRoomId: string,
		externalSenderId: string,
		content: Buffer,
		fileDetails: { filename: string; fileSize: number; mimeType: string; metadata?: { width?: number; height?: number; format?: string } },
		relatesToEventId: string,
	): Promise<string> {
		try {
			const mxcUrl = await this.bridgeInstance.getIntent(externalSenderId).uploadContent(content);
			const messageId = await this.bridgeInstance
				.getIntent(externalSenderId)
				.matrixClient.sendRawEvent(externalRoomId, MatrixEventType.ROOM_MESSAGE_SENT, {
					'body': fileDetails.filename,
					'filename': fileDetails.filename,
					'info': {
						size: fileDetails.fileSize,
						mimetype: fileDetails.mimeType,
						...(fileDetails.metadata?.height && fileDetails.metadata?.width
							? { h: fileDetails.metadata?.height, w: fileDetails.metadata?.width }
							: {}),
					},
					'msgtype': this.getMsgTypeBasedOnMimeType(fileDetails.mimeType),
					'url': mxcUrl,
					'm.relates_to': {
						'rel_type': 'm.thread',
						'event_id': relatesToEventId,
						'is_falling_back': true,
						'm.in_reply_to': {
							event_id: relatesToEventId,
						},
					},
				});

			return messageId;
		} catch (e: any) {
			federationBridgeLogger.error({ msg: 'Error sending file to thread', err: e });
			if (e.body?.includes('413') || e.body?.includes('M_TOO_LARGE')) {
				throw new Error('File is too large');
			}
			return '';
		}
	}

	public async sendReplyMessageFileToThread(
		externalRoomId: string,
		externalSenderId: string,
		content: Buffer,
		fileDetails: { filename: string; fileSize: number; mimeType: string; metadata?: { width?: number; height?: number; format?: string } },
		eventToReplyTo: string,
		relatesToEventId: string,
	): Promise<string> {
		try {
			const mxcUrl = await this.bridgeInstance.getIntent(externalSenderId).uploadContent(content);
			const messageId = await this.bridgeInstance
				.getIntent(externalSenderId)
				.matrixClient.sendRawEvent(externalRoomId, MatrixEventType.ROOM_MESSAGE_SENT, {
					'body': fileDetails.filename,
					'filename': fileDetails.filename,
					'info': {
						size: fileDetails.fileSize,
						mimetype: fileDetails.mimeType,
						...(fileDetails.metadata?.height && fileDetails.metadata?.width
							? { h: fileDetails.metadata?.height, w: fileDetails.metadata?.width }
							: {}),
					},
					'msgtype': this.getMsgTypeBasedOnMimeType(fileDetails.mimeType),
					'url': mxcUrl,
					'm.relates_to': {
						'rel_type': 'm.thread',
						'event_id': relatesToEventId,
						'is_falling_back': false,
						'm.in_reply_to': {
							event_id: eventToReplyTo,
						},
					},
				});

			return messageId;
		} catch (e: any) {
			federationBridgeLogger.error({ msg: 'Error sending file to thread', err: e });
			if (e.body?.includes('413') || e.body?.includes('M_TOO_LARGE')) {
				throw new Error('File is too large');
			}
			return '';
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
			homeServerDomain: this.internalSettings.getHomeServerDomain(),
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
		return convertEmojisFromRCFormatToMatrixFormat(text);
	}

	public async getReadStreamForFileFromUrl(externalUserId: string, fileUrl: string): Promise<ReadableStream> {
		const response = await fetch(await this.convertMatrixUrlToHttp(externalUserId, fileUrl));
		if (!response.body) {
			throw new Error('Not able to download the file');
		}

		return response.body as unknown as ReadableStream;
	}

	public isUserIdFromTheSameHomeserver(externalUserId: string, domain: string): boolean {
		const userDomain = this.extractHomeserverOrigin(externalUserId);

		return userDomain === domain;
	}

	public extractHomeserverOrigin(externalUserId: string): string {
		return externalUserId.includes(':') ? externalUserId.split(':').pop() || '' : this.internalSettings.getHomeServerDomain();
	}

	public isRoomFromTheSameHomeserver(externalRoomId: string, domain: string): boolean {
		return this.isUserIdFromTheSameHomeserver(externalRoomId, domain);
	}

	public logFederationStartupInfo(info?: string): void {
		federationBridgeLogger.info(`${info}:
			id: ${this.internalSettings.getApplicationServiceId()}
			bridgeUrl: ${this.internalSettings.getBridgeUrl()}
			homeserverURL: ${this.internalSettings.getHomeServerUrl()}
			homeserverDomain: ${this.internalSettings.getHomeServerDomain()}
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

	public async setRoomPowerLevels(
		externalRoomId: string,
		externalOwnerId: string,
		externalUserId: string,
		powerLevels: number,
	): Promise<void> {
		await this.bridgeInstance.getIntent(externalOwnerId).setPowerLevel(externalRoomId, externalUserId, powerLevels);
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
					key: convertEmojisFromRCFormatToMatrixFormat(reaction),
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
			await toExternalMessageFormat({
				message: newMessageText,
				externalRoomId,
				homeServerDomain: this.internalSettings.getHomeServerDomain(),
			}),
		);

		await this.bridgeInstance.getIntent(externalUserId).matrixClient.sendEvent(externalRoomId, MatrixEventType.ROOM_MESSAGE_SENT, {
			'body': ` * ${this.escapeEmojis(newMessageText)}`,
			'format': 'org.matrix.custom.html',
			'formatted_body': messageInExternalFormat,
			'm.new_content': {
				body: this.escapeEmojis(newMessageText),
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
			federationBridgeLogger.error({ msg: 'Error sending file to room', err: e });
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
			federationBridgeLogger.error({ msg: 'Error sending file to room', err: e });
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

	private getMyHomeServerOrigin() {
		return new URL(`https://${this.internalSettings.getHomeServerDomain()}`).hostname;
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
			federationBridgeLogger.error({ msg: 'Error uploading content to Matrix', err: e });
			if (e.body?.includes('413') || e.body?.includes('M_TOO_LARGE')) {
				throw new Error('File is too large');
			}
		}
	}

	public async getRoomName(externalRoomId: string, externalUserId: string): Promise<string | undefined> {
		try {
			const roomState = (await this.bridgeInstance.getIntent(externalUserId).roomState(externalRoomId)) as AbstractMatrixEvent[];

			return ((roomState || []).find((event) => event?.type === MatrixEventType.ROOM_NAME_CHANGED) as MatrixEventRoomNameChanged)?.content
				?.name;
		} catch (error) {
			// no-op
		}
	}

	public async getRoomTopic(externalRoomId: string, externalUserId: string): Promise<string | undefined> {
		try {
			const roomState = (await this.bridgeInstance.getIntent(externalUserId).roomState(externalRoomId)) as AbstractMatrixEvent[];

			return ((roomState || []).find((event) => event?.type === MatrixEventType.ROOM_TOPIC_CHANGED) as MatrixEventRoomTopicChanged)?.content
				?.topic;
		} catch (error) {
			// no-op
		}
	}

	public async setRoomName(externalRoomId: string, externalUserId: string, roomName: string): Promise<void> {
		await this.bridgeInstance.getIntent(externalUserId).setRoomName(externalRoomId, roomName);
	}

	public async setRoomTopic(externalRoomId: string, externalUserId: string, roomTopic: string): Promise<void> {
		await this.bridgeInstance.getIntent(externalUserId).setRoomTopic(externalRoomId, roomTopic);
	}

	public convertMatrixUrlToHttp(externalUserId: string, matrixUrl: string): Promise<string> {
		return this.bridgeInstance.getIntent(externalUserId).matrixClient.mxcToHttp(matrixUrl);
	}

	protected async createInstance(): Promise<void> {
		federationBridgeLogger.info('Performing Dynamic Import of matrix-appservice-bridge');

		// Dynamic import to prevent Rocket.Chat from loading the module until needed and then handle if that fails
		const { Bridge, AppServiceRegistration, MatrixUser } = await import('matrix-appservice-bridge');
		MatrixUserInstance = MatrixUser;
		const registrationFile = this.internalSettings.getAppServiceRegistrationObject();

		this.bridgeInstance = new Bridge({
			homeserverUrl: this.internalSettings.getHomeServerUrl(),
			domain: this.internalSettings.getHomeServerDomain(),
			registration: AppServiceRegistration.fromObject(this.convertRegistrationFileToMatrixFormat(registrationFile)),
			disableStores: true,
			controller: {
				onEvent: (request) => {
					const event = request.getData() as unknown as AbstractMatrixEvent;

					// TODO: can we ignore all events from out homeserver?
					// This was added particularly to avoid duplicating messages.
					// Messages sent from rocket.chat also causes a m.room.message event, which if gets to this bridge
					// before the event id promise is resolved, the respective message does not get event id attached to them any longer,
					// thus this event handler "resends" the message to the rocket.chat room (not to matrix though).
					if (event.type === 'm.room.message' && this.extractHomeserverOrigin(event.sender) === this.getMyHomeServerOrigin()) {
						return;
					}

					this.eventHandler(event);
				},
				onLog: (line, isError) => {
					console.log(line, isError);
				},
				...(this.internalSettings.getAppServiceRegistrationObject().enableEphemeralEvents
					? {
							onEphemeralEvent: (request) => {
								const event = request.getData() as unknown as AbstractMatrixEvent;
								this.eventHandler(event);
							},
						}
					: {}),
			},
		});
	}

	private convertRegistrationFileToMatrixFormat(registrationFile: IFederationBridgeRegistrationFile): AppServiceOutput {
		return {
			'id': registrationFile.id,
			'hs_token': registrationFile.homeserverToken,
			'as_token': registrationFile.applicationServiceToken,
			'url': registrationFile.bridgeUrl,
			'sender_localpart': registrationFile.botName,
			'namespaces': registrationFile.listenTo,
			'de.sorunome.msc2409.push_ephemeral': registrationFile.enableEphemeralEvents,
		};
	}

	public async ping(): Promise<{ durationMs: number }> {
		if (!this.isRunning || !this.bridgeInstance) {
			throw new Error("matrix bridge isn't yet running");
		}

		const { duration_ms: durationMs } = await this.bridgeInstance.getIntent().matrixClient.doRequest(
			'POST',
			`/_matrix/client/v1/appservice/${this.internalSettings.getApplicationServiceId()}/ping`,
			{},
			/*
			 * Empty txn id as it is optional, neither does the spec says exactly what to do with it.
			 * https://github.com/matrix-org/matrix-spec/blob/1fc8f8856fe47849f90344cfa91601c984627acb/data/api/client-server/appservice_ping.yaml#L55-L56
			 */
			{},
			DEFAULT_TIMEOUT_IN_MS_FOR_PING_EVENT,
		);

		return { durationMs };
	}

	public async deactivateUser(uid: string): Promise<void> {
		/*
		 * https://spec.matrix.org/v1.11/client-server-api/#post_matrixclientv3accountdeactivate
		 * Using { erase: false } since rocket.chat side on deactivation we do not delete anything.
		 */
		const resp = await this.bridgeInstance
			.getIntent()
			.matrixClient.doRequest('POST', '/_matrix/client/v3/account/deactivate', { user_id: uid }, { erase: false });
		if (resp.id_server_unbind_result !== 'success') {
			throw new Error('Failed to deactivate matrix user');
		}
	}
}

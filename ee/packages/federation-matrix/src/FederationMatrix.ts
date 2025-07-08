import 'reflect-metadata';

import { type IFederationMatrixService, ServiceClass, Settings } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type { HomeserverEventSignatures, HomeserverServices, DependencyContainer } from '@hs/federation-sdk';
import { getAllServices } from '@hs/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { MatrixBridgedUser, MatrixBridgedRoom, Users } from '@rocket.chat/models';

import { registerEvents } from './events';
import { setup } from './setupContainers';

export class FederationMatrix extends ServiceClass implements IFederationMatrixService {
	protected name = 'federation-matrix';

	private eventHandler: Emitter<HomeserverEventSignatures>;

	private homeserverServices: HomeserverServices;

	private matrixDomain: string;

	private diContainer: DependencyContainer;

	private readonly logger = new Logger(this.name);

	private constructor(emitter?: Emitter<HomeserverEventSignatures>) {
		super();
		this.eventHandler = emitter || new Emitter<HomeserverEventSignatures>();
	}

	static async create(emitter?: Emitter<HomeserverEventSignatures>): Promise<FederationMatrix> {
		const instance = new FederationMatrix(emitter);
		instance.diContainer = await setup(instance.eventHandler);
		
		return instance;
	}

	async created(): Promise<void> {
		try {
			registerEvents(this.eventHandler);
		} catch (error) {
			this.logger.warn('Homeserver module not available, running in limited mode');
		}
	}

	async getMatrixDomain(): Promise<string> {
		if (this.matrixDomain) {
			return this.matrixDomain;
		}

		const port = await Settings.get<number>('Federation_Service_Matrix_Port');
		const domain = await Settings.get<string>('Federation_Service_Matrix_Domain');

		this.matrixDomain = port === 443 || port === 80 ? domain : `${domain}:${port}`;

		return this.matrixDomain;
	}

	async started(): Promise<void> {
		this.homeserverServices = getAllServices(this.diContainer);
	}

	getAllRoutes() {
		return [];
	}

	async createRoom(room: IRoom, owner: IUser, members: string[]): Promise<void> {
		if (!this.homeserverServices) {
			this.logger.warn('Homeserver services not available, skipping room creation');
			return;
		}

		try {
			const matrixDomain = await this.getMatrixDomain();
			const matrixUserId = `@${owner.username}:${matrixDomain}`;
			const roomName = room.name || room.fname || 'Untitled Room';
			const canonicalAlias = room.fname ? `#${room.fname}:${matrixDomain}` : undefined;

			const matrixRoomResult = await this.homeserverServices.room.createRoom(
				matrixUserId,
				matrixUserId,
				roomName,
				canonicalAlias,
				canonicalAlias,
			);

			this.logger.debug('Matrix room created:', matrixRoomResult);

			await MatrixBridgedRoom.createOrUpdateByLocalRoomId(room._id, matrixRoomResult.room_id, matrixDomain);

			await MatrixBridgedUser.createOrUpdateByLocalId(owner._id, matrixUserId, true, matrixDomain);

			for await (const member of members) {
				if (member === owner.username) {
					continue;
				}

				try {
					// TODO: Check if it is external user - split domain etc
					const localUserId = await Users.findOneByUsername(member);
					if (localUserId) {
						await MatrixBridgedUser.createOrUpdateByLocalId(localUserId._id, member, true, matrixDomain);
						// continue;
					}
				} catch (error) {
					this.logger.error('Error creating or updating bridged user:', error);
				}

				// We are not generating bridged users for members outside of the current workspace
				// They will be created when the invite is accepted

				await this.homeserverServices.invite.inviteUserToRoom(member, matrixRoomResult.room_id, matrixUserId, roomName);
			}

			this.logger.debug('Room creation completed successfully', room._id);
		} catch (error) {
			console.log(error);
			this.logger.error('Failed to create room:', error);
			throw error;
		}
	}

	async sendMessage(message: IMessage, room: IRoom, user: IUser): Promise<void> {
		try {
			const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(room._id);
			if (!matrixRoomId) {
				throw new Error(`No Matrix room mapping found for room ${room._id}`);
			}

			const matrixDomain = await this.getMatrixDomain();
			const matrixUserId = `@${user.username}:${matrixDomain}`;
			const existingMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(user._id);
			if (!existingMatrixUserId) {
				const port = await Settings.get<number>('Federation_Service_Matrix_Port');
				const domain = await Settings.get<string>('Federation_Service_Matrix_Domain');
				const matrixDomain = port === 443 || port === 80 ? domain : `${domain}:${port}`;
				await MatrixBridgedUser.createOrUpdateByLocalId(user._id, matrixUserId, true, matrixDomain);
			}

			// TODO: We should fix this to not hardcode neither inform the target server
			// This is on the homeserver mandate to track all the eligible servers in the federated room
			const targetServer = 'hs1-garim.tunnel.dev.rocket.chat';

			if (!this.homeserverServices) {
				this.logger.warn('Homeserver services not available, skipping message send');
				return;
			}

			const result = await this.homeserverServices.message.sendMessage(matrixRoomId, message.msg, matrixUserId, targetServer);

			// TODO: Store the event ID mapping for future reference (edits, deletions, etc.)
			// This would allow us to map between Rocket.Chat message IDs and Matrix event IDs

			this.logger.debug('Message sent to Matrix successfully:', result.event_id);
		} catch (error) {
			this.logger.error('Failed to send message to Matrix:', error);
			throw error;
		}
	}
}

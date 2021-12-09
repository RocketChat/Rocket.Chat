
import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Cursor, FindOneOptions } from 'mongodb';
import { Random } from 'meteor/random';
import _ from 'underscore';

import {
	LivechatDepartment,
} from '../../../models/server';
import { VoipVisitor, VoipRoom } from '../../../models/server/raw';
import { Logger } from '../../../logger/server';
import { normalizeAgent, validateEmail, createVoipRoom, createVoipSubscription, updateSubscriptionDisplayNameByRoomId, removeSubscriptionByRoomId } from './Helper';
import { IVisitor } from '../../../../definition/IVisitor';
import { IOmnichannelRoom, IRoom } from '../../../../definition/IRoom';
import { callbacks } from '../../../callbacks/server';


export class Voip {
	static logger: Logger = new Logger('Voip');;

	static async getVisitorByToken(token: string, _options: FindOneOptions<IVisitor> = {}): Promise<IVisitor | null> {
		return VoipVisitor.getVisitorByToken(token, _options);
	}

	static async getVisitorById(id: string, _options: FindOneOptions<IVisitor> = {}): Promise<IVisitor | null> {
		return VoipVisitor.findOneById(id, _options);
	}

	static findOpenRoomByVisitorToken(token: string, _options: FindOneOptions<IOmnichannelRoom> = {}): Cursor<IOmnichannelRoom> {
		return VoipRoom.findOpenByVisitorToken(token, _options);
	}

	static async notifyGuestStatusChanged(token: string, status: string): Promise<void> {
		VoipRoom.updateVisitorStatus(token, status);
	}

	static async registerGuest(id: string,
		token: string,
		name: string,
		email: string,
		department: string,
		phone: any,
		username: string): Promise<any> {
		this.logger.debug({ msg: 'registerGuest' });
		check(token, String);
		check(id, Match.Maybe(String));

		this.logger.debug(`New incoming conversation: id: ${ id } | token: ${ token }`);
		let userId;
		const updateUser = {
			$set: {
				token,
				...phone?.number ? { phone: [{ phoneNumber: phone.number }] } : {},
				...name ? { name } : {},
				visitorEmails: [{ address: '' }],
				department: '',
			},

		};

		if (email) {
			email = email.trim();
			validateEmail(email);
			updateUser.$set.visitorEmails = [
				{ address: email },
			];
		}
		if (department) {
			this.logger.debug(`Attempt to find a department with id/name ${ department }`);
			const dep = LivechatDepartment.findOneByIdOrName(department);
			if (!dep) {
				this.logger.debug('Invalid department provided');
				throw new Meteor.Error('error-invalid-department', 'The provided department is invalid', { method: 'registerGuest' });
			}
			this.logger.debug(`Assigning visitor ${ token } to department ${ dep._id }`);
			updateUser.$set.department = dep._id;
		}
		const user = await VoipVisitor.getVisitorByToken(token);
		const existingUser = await VoipVisitor.findOneGuestByEmailAddress(email);

		if (user) {
			this.logger.debug('Found matching user by token');
			userId = user._id;
		} else if (email && existingUser) {
			this.logger.debug('Found matching user by email');
			userId = existingUser._id;
		} else {
			this.logger.debug(`No matches found. Attempting to create new user with token ${ token }`);
			if (!username) {
				username = await VoipVisitor.getNextVisitorUsername();
			}
			const userData = {
				username,
				ts: new Date().toString(),
				_id: id,
				token,
			};
			this.logger.debug({ msg: 'registerGuest inserting user ', userData });
			userId = await VoipVisitor.insert(userData);
		}
		if (userId) {
			VoipVisitor.updateById(userId, updateUser);
			return userId;
		}
		return '';
	}

	static async removeGuest(_id: string): Promise<any> {
		check(_id, String);
		const guest = VoipVisitor.findOneById(_id);
		if (!guest) {
			throw new Meteor.Error('error-invalid-guest', 'Invalid guest', { method: 'livechat:removeGuest' });
		}

		await this.cleanGuestHistory(_id);
		return VoipVisitor.removeById(_id);
	}

	static async cleanGuestHistory(_id: string): Promise<void> {
		const guest = await VoipVisitor.findOneById(_id);
		if (!guest) {
			throw new Meteor.Error('error-invalid-guest', 'Invalid guest', { method: 'livechat:cleanGuestHistory' });
		}

		const { token } = guest;
		check(token, String);
		/*
		Note(Amol): We need to determine if we need the functions below
		or we can safely delete this function for VoIP.
		!!!!!!!!Delete this comment before mergning the PR!!!!!!!!
		LivechatRooms.findByVisitorToken(token).forEach((room) => {
			FileUpload.removeFilesByRoomId(room._id);
			Messages.removeByRoomId(room._id);
		});

		Subscriptions.removeByVisitorToken(token);
		LivechatRooms.removeByVisitorToken(token);
		LivechatInquiry.removeByVisitorToken(token);
		*/
	}

	static findAgent(agentId: string): any {
		return normalizeAgent(agentId);
	}

	/*
	static async getRoom(guest: IVisitor, rid: string, roomInfo: string, agent: string): Promise<IRoom> {
		const token = guest && guest.token;

		const message = {
			_id: Random.id(),
			rid,
			msg: '',
			token,
			ts: new Date(),
		};

		return Livechat.getRoom(guest, message, roomInfo, agent, extraParams);
	}
	*/

	static async getNewRoom(guest: IVisitor, agent: any, rid: string, roomInfo: any): Promise<any> {
		this.logger.debug(`Attempting to find or create a room for visitor ${ guest._id }`);
		const message = {
			_id: Random.id(),
			rid,
			msg: '',
			token: guest.token,
			ts: new Date(),
		};
		let room = await VoipRoom.findOneById(message.rid);
		let newRoom = false;

		if (room && !room.open) {
			this.logger.debug(`Last room for visitor ${ guest._id } closed. Creating new one`);
			message.rid = Random.id();
			room = null;
		}
		if (room == null) {
			// delegate room creation to QueueManager
			this.logger.debug(`Calling QueueManager to request a room for visitor ${ guest._id }`);
			// room = await QueueManager.requestRoom({ guest, message, roomInfo, agent: defaultAgent, extraData });
			const name = (roomInfo && roomInfo.fname) || guest.name || guest.username;
			room = await VoipRoom.findOneById(await createVoipRoom(rid, name, guest));
			newRoom = true;

			this.logger.debug(`Room obtained for visitor ${ guest._id } -> ${ room?._id }`);

			// Now add the subscription
			await createVoipSubscription(rid, name, guest, agent);
		}

		if (!room) {
			this.logger.debug(`Visitor ${ guest._id } trying to access another visitor's room`);
			throw new Meteor.Error('cannot-access-room');
		}
		return { room, newRoom };
	}

	static async saveRoomInfo(roomData: IRoom, guestData: IVisitor): Promise<any> {
		this.logger.debug(`Saving room information on room ${ roomData._id }`);
		if (!_.isEmpty(guestData.name)) {
			const { _id: rid } = roomData;
			const { name } = guestData;
			if (name) {
				return await VoipRoom.setFnameById(rid, name)
				// This one needs to be the last since the agent may not have the subscription
				// when the conversation is in the queue, then the result will be 0(zero)
				&& updateSubscriptionDisplayNameByRoomId(rid, name);
			}
		}
	}

	static async findRoom(token: string, rid: string): Promise<IOmnichannelRoom | null> {
		const fields = {
			t: 1,
			departmentId: 1,
			servedBy: 1,
			open: 1,
			v: 1,
			ts: 1,
		};

		if (!rid) {
			return VoipRoom.findOneByVisitorToken(token, fields);
		}

		return VoipRoom.findOneByIdAndVisitorToken(rid, token, fields);
	}

	static async closeRoom(visitor: IVisitor, room: IOmnichannelRoom, /* comment: any,*/ options = {}): Promise<any> {
		this.logger.debug(`Attempting to close room ${ room._id }`);
		if (!room || room.t !== 'v' || !room.open) {
			return false;
		}

		const params = callbacks.run('livechat.beforeCloseRoom', { room, options });
		const { extraData } = params;

		const now = new Date();
		const { _id: rid } = room;

		const closeData = {
			closedAt: now,
			callDuration: now.getTime() / 1000,
			...extraData,
		};
		this.logger.debug(`Room ${ room._id } was closed at ${ closeData.closedAt } (duration ${ closeData.chatDuration })`);

		/*
		// We should be able to handle nearend and farend call end.
		if (user) {
			this.logger.debug(`Closing by user ${ user._id }`);
			closeData.closer = 'user';
			closeData.closedBy = {
				_id: user._id,
				username: user.username,
			};
		} else
		*/
		if (visitor) {
			this.logger.debug(`Closing by visitor ${ visitor._id }`);
			closeData.closer = 'visitor';
			closeData.closedBy = {
				_id: visitor._id,
				username: visitor.username,
			};
		}

		VoipRoom.closeByRoomId(rid, closeData);
		removeSubscriptionByRoomId(rid);
		// Retreive the closed room
		/**
		 * Note (Amol) How do we handle the code below
		 */
		/*
		const closedRoom = await VoipRoom.findOneByIdOrName(rid, {});

		this.logger.debug(`Sending closing message to room ${ room._id }`);
		const message = {
			t: 'livechat-close',
			msg: comment,
			groupable: false,
			transcriptRequested: !!transcriptRequest,
		};
		sendMessage(visitor, message, closedRoom);


		Meteor.defer(() => {
			/**
			 * @deprecated the `AppEvents.ILivechatRoomClosedHandler` event will be removed
			 * in the next major version of the Apps-Engine

			Apps.getBridges().getListenerBridge().livechatEvent(AppEvents.ILivechatRoomClosedHandler, room);
			Apps.getBridges().getListenerBridge().livechatEvent(AppEvents.IPostLivechatRoomClosed, room);
		});
		callbacks.runAsync('livechat.closeRoom', room);
		*/
		return true;
	}
}

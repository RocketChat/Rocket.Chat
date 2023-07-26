import type { StreamKeys, StreamerCallback } from '@rocket.chat/ddp-client/src/types/streams';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import './Presence';
import { sdk } from '../../../utils/client/lib/SDKClient';

type ExtractSecondString<E> = E extends `${string}/${infer X}` ? X : never;

class Notifications {
	private logged: boolean;

	private loginCb: any[];

	private debug: boolean;

	constructor() {
		this.logged = Meteor.userId() !== null;
		this.loginCb = [];
		Tracker.autorun(() => {
			if (Meteor.userId() !== null && this.logged === false) {
				this.loginCb.forEach((cb) => cb());
			}
			this.logged = Meteor.userId() !== null;
		});
		this.debug = false;
	}

	onLogged<E extends StreamKeys<'notify-logged'>>(eventName: E, callback: StreamerCallback<'notify-logged', E>) {
		return this.onLogin(() => sdk.stream('notify-logged', [eventName], callback));
	}

	onAll<E extends StreamKeys<'notify-all'>>(eventName: E, callback: StreamerCallback<'notify-all', E>) {
		return sdk.stream('notify-all', [eventName], callback);
	}

	onRoom<E extends ExtractSecondString<StreamKeys<'notify-room'>>>(
		room: string,
		eventName: E,
		callback: StreamerCallback<'notify-room', `${string}/${E}`>,
	) {
		return sdk.stream('notify-room', [`${room}/${eventName}`], callback);
	}

	onUser<E extends ExtractSecondString<StreamKeys<'notify-user'>>>(
		eventName: E,
		callback: StreamerCallback<'notify-user', `${string}/${E}`>,
	) {
		return sdk.stream('notify-user', [`${Meteor.userId()}/${eventName}`], callback);
	}

	onVisitor<E extends ExtractSecondString<StreamKeys<'notify-user'>>>(
		visitor: string,
		eventName: E,
		callback: StreamerCallback<'notify-user', `${string}/${E}`>,
	) {
		return sdk.stream('notify-user', [`${visitor}/${eventName}`], callback);
	}

	unUser<E extends ExtractSecondString<StreamKeys<'notify-user'>>>(eventName: E) {
		return sdk.stop('notify-user', `${Meteor.userId()}/${eventName}`);
	}

	unRoom<E extends ExtractSecondString<StreamKeys<'notify-room'>>>(room: string, eventName: E) {
		return sdk.stop('notify-room', `${room}/${eventName}`);
	}

	onLogin(cb: () => void) {
		this.loginCb.push(cb);
		if (this.logged) {
			return cb();
		}
	}

	notifyRoom<E extends ExtractSecondString<StreamKeys<'notify-room'>>>(room: string, eventName: E, ...args: any[]) {
		args.unshift(`${room}/${eventName}`);
		return sdk.publish('notify-room', args);
	}

	notifyVisitor<E extends ExtractSecondString<StreamKeys<'notify-user'>>>(visitor: string, eventName: E, ...args: any[]) {
		args.unshift(`${visitor}/${eventName}`);
		return sdk.publish('notify-user', args);
	}

	notifyUser<E extends ExtractSecondString<StreamKeys<'notify-user'>>>(uid: string, eventName: E, ...args: any[]) {
		args.unshift(`${uid}/${eventName}`);
		return sdk.publish('notify-user', args);
	}

	notifyUsersOfRoom<E extends ExtractSecondString<StreamKeys<'notify-room-users'>>>(room: string, eventName: E, ...args: any[]) {
		if (this.debug === true) {
			console.log('RocketChat.Notifications: notifyUsersOfRoomExceptSender', [room, eventName, ...args]);
		}
		args.unshift(`${room}/${eventName}`);
		return sdk.publish('notify-room-users', args);
	}
}

/** @deprecated it should be used `sdk`instead both perform the same */
const ns = new Notifications();

export default ns;

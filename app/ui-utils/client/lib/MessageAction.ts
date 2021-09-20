import { MouseEvent } from 'react';
import _ from 'underscore';
import mem from 'mem';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

import { roomTypes } from '../../../utils/client';
import { Messages, Rooms, Subscriptions } from '../../../models/client';
import { IMessage } from '../../../../definition/IMessage';
import { IUser } from '../../../../definition/IUser';
import { ISubscription } from '../../../../definition/ISubscription';
import { TranslationKey } from '../../../../client/contexts/TranslationContext';
import { IRoom } from '../../../../definition/IRoom';

const call = (method: string, ...args: any[]): Promise<any> => new Promise((resolve, reject) => {
	Meteor.call(method, ...args, function(err: any, data: any) {
		if (err) {
			return reject(err);
		}
		resolve(data);
	});
});

export const addMessageToList = (messagesList: IMessage[], message: IMessage): IMessage[] => {
	// checks if the message is not already on the list
	if (!messagesList.find(({ _id }) => _id === message._id)) {
		messagesList.push(message);
	}

	return messagesList;
};


type MessageActionGroup = 'message' | 'menu';
type MessageActionContext = 'message' | 'threads' | 'message-mobile'| 'pinned' | 'direct' | 'starred' | 'mentions';

type MessageActionConditionProps = {
	message: IMessage;
	user: IUser;
	room: IRoom;
	subscription?: ISubscription;
	context?: MessageActionContext;
};

type MessageActionConfig = {
	id: string;
	icon: string;
	label: TranslationKey;
	order?: number;
	group?: MessageActionGroup | MessageActionGroup[];
	context?: MessageActionContext[];
	action: (e: MouseEvent, { message }: { message: IMessage }) => any;
	condition?: (props: MessageActionConditionProps) => boolean;
}

type MessageActionConfigList = MessageActionConfig[];

export const MessageAction = new class {
	/*
  	config expects the following keys (only id is mandatory):
  		id (mandatory)
  		icon: string
  		label: string
  		action: function(event, instance)
  		condition: function(message)
			order: integer
			group: string (message or menu)
   */

	buttons = new ReactiveVar<Record<string, MessageActionConfig>>({});

	addButton(config: MessageActionConfig): void{
		if (!config || !config.id) {
			return;
		}

		if (!config.group) {
			config.group = 'menu';
		}

		if (config.condition) {
			config.condition = mem(config.condition, { maxAge: 1000, cacheKey: JSON.stringify });
		}

		return Tracker.nonreactive(() => {
			const btns = this.buttons.get();
			btns[config.id] = config;
			mem.clear(this._getButtons);
			mem.clear(this.getButtonsByGroup);
			return this.buttons.set(btns);
		});
	}

	removeButton(id: MessageActionConfig['id']): void {
		return Tracker.nonreactive(() => {
			const btns = this.buttons.get();
			delete btns[id];
			return this.buttons.set(btns);
		});
	}

	updateButton(id: MessageActionConfig['id'], config: MessageActionConfig): void {
		return Tracker.nonreactive(() => {
			const btns = this.buttons.get();
			if (btns[id]) {
				btns[id] = _.extend(btns[id], config);
				return this.buttons.set(btns);
			}
		});
	}

	getButtonById(id: MessageActionConfig['id']): MessageActionConfig | undefined {
		const allButtons = this.buttons.get();
		return allButtons[id];
	}

	_getButtons = mem((): MessageActionConfigList => _.sortBy(_.toArray(this.buttons.get()), 'order'))

	getButtonsByCondition(prop: MessageActionConditionProps, arr: MessageActionConfigList = MessageAction._getButtons()): MessageActionConfigList {
		return arr.filter((button) => button.condition == null || button.condition(prop));
	}

	getButtonsByGroup = mem(function(group: MessageActionGroup, arr: MessageActionConfigList = MessageAction._getButtons()): MessageActionConfigList {
		return arr.filter((button) => (Array.isArray(button.group) ? button.group.includes(group) : button.group === group));
	})

	getButtonsByContext = mem(function(context: MessageActionContext, arr: MessageActionConfigList): MessageActionConfigList {
		return arr.filter((button) => !context || button.context == null || button.context.includes(context));
	})

	getButtons(props: MessageActionConditionProps, context: MessageActionContext, group: MessageActionGroup): MessageActionConfigList {
		const allButtons = group ? this.getButtonsByGroup(group) : MessageAction._getButtons();

		if (props.message) {
			return this.getButtonsByCondition({ ...props, context }, this.getButtonsByContext(context, allButtons));
		}
		return allButtons;
	}

	resetButtons(): void {
		mem.clear(this._getButtons);
		mem.clear(this.getButtonsByGroup);
		return this.buttons.set({});
	}

	async getPermaLink(msgId: string): Promise<string> {
		if (!msgId) {
			throw new Error('invalid-parameter');
		}

		const msg = Messages.findOne(msgId) || await call('getSingleMessage', msgId);
		if (!msg) {
			throw new Error('message-not-found');
		}
		const roomData = Rooms.findOne({
			_id: msg.rid,
		});

		if (!roomData) {
			throw new Error('room-not-found');
		}

		const subData = Subscriptions.findOne({ rid: roomData._id, 'u._id': Meteor.userId() });
		const roomURL = roomTypes.getURL(roomData.t, subData || roomData);
		return `${ roomURL }?msg=${ msgId }`;
	}
}();

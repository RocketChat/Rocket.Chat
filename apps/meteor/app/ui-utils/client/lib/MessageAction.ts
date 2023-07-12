import type { ContextType } from 'react';
import mem from 'mem';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import type { IMessage, IUser, ISubscription, IRoom, SettingValue, Serialized, ITranslatedMessage } from '@rocket.chat/core-typings';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { Keys as IconName } from '@rocket.chat/icons';

import { ChatMessage, ChatRoom, ChatSubscription } from '../../../models/client';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import type { ToolboxContextValue } from '../../../../client/views/room/contexts/ToolboxContext';
import type { ChatContext } from '../../../../client/views/room/contexts/ChatContext';
import type { AutoTranslateOptions } from '../../../../client/views/room/MessageList/hooks/useAutoTranslate';
import { sdk } from '../../../utils/client/lib/SDKClient';
import { RoomNotFoundError } from '../../../../client/lib/errors/RoomNotFoundError';
import { MessageNotFoundError } from '../../../../client/lib/errors/MessageNotFoundError';

type MessageActionGroup = 'message' | 'menu';

export type MessageActionContext =
	| 'message'
	| 'threads'
	| 'message-mobile'
	| 'pinned'
	| 'direct'
	| 'starred'
	| 'mentions'
	| 'federated'
	| 'videoconf'
	| 'search';

export type MessageActionConditionProps = {
	message: IMessage;
	user: IUser | undefined;
	room: IRoom;
	subscription?: ISubscription;
	context?: MessageActionContext;
	settings: { [key: string]: SettingValue };
	chat: ContextType<typeof ChatContext>;
};

export type MessageActionConfig = {
	id: string;
	icon: IconName;
	variant?: 'danger' | 'success' | 'warning';
	label: TranslationKey;
	order?: number;
	/* @deprecated */
	color?: string;
	role?: string;
	group?: MessageActionGroup | MessageActionGroup[];
	context?: MessageActionContext[];
	action: (
		e: Pick<Event, 'preventDefault' | 'stopPropagation'>,
		{
			message,
			tabbar,
			room,
			chat,
			autoTranslateOptions,
		}: {
			message: IMessage & Partial<ITranslatedMessage>;
			tabbar: ToolboxContextValue;
			room?: IRoom;
			chat: ContextType<typeof ChatContext>;
			autoTranslateOptions?: AutoTranslateOptions;
		},
	) => any;
	condition?: (props: MessageActionConditionProps) => Promise<boolean> | boolean;
};

type MessageActionConfigList = MessageActionConfig[];

export const MessageAction = new (class MessageAction {
	private buttons = new ReactiveVar<Record<string, MessageActionConfig>>({});

	addButton(config: MessageActionConfig): void {
		if (!config?.id) {
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

	private _getButtons = mem(
		(): MessageActionConfigList => Object.values(this.buttons.get()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
		{
			maxAge: 1000,
		},
	);

	private async getButtonsByCondition(
		prop: MessageActionConditionProps,
		arr: MessageActionConfigList = this._getButtons(),
	): Promise<MessageActionConfigList> {
		return (
			await Promise.all(
				arr.map(async (button) => {
					return [button, !button.condition || (await button.condition(prop))] as const;
				}),
			)
		)
			.filter(([, condition]) => condition)
			.map(([button]) => button);
	}

	private getButtonsByGroup = mem(
		(group: MessageActionGroup, arr: MessageActionConfigList = this._getButtons()): MessageActionConfigList => {
			return arr.filter((button) => !button.group || (Array.isArray(button.group) ? button.group.includes(group) : button.group === group));
		},
		{ maxAge: 1000 },
	);

	private getButtonsByContext(context: MessageActionContext, arr: MessageActionConfigList): MessageActionConfigList {
		return !context ? arr : arr.filter((button) => !button.context || button.context.includes(context));
	}

	async getButtons(
		props: MessageActionConditionProps,
		context: MessageActionContext,
		group: MessageActionGroup,
	): Promise<MessageActionConfigList> {
		const allButtons = group ? this.getButtonsByGroup(group) : this._getButtons();

		if (props.message) {
			return this.getButtonsByCondition({ ...props, context }, this.getButtonsByContext(context, allButtons));
		}
		return allButtons;
	}

	private static async getMessage(mid: string): Promise<Serialized<IMessage> | undefined> {
		try {
			const { message } = await sdk.rest.get('/v1/chat.getMessage', { msgId: mid });
			return message;
		} catch {
			return undefined;
		}
	}

	async getPermaLink(mid: string): Promise<string> {
		if (!mid) {
			throw new Error('invalid-parameter');
		}

		const message = ChatMessage.findOne(mid) || (await MessageAction.getMessage(mid));
		if (!message) {
			throw new MessageNotFoundError('Message not found', { mid });
		}

		const room = ChatRoom.findOne({ _id: message.rid });

		if (!room) {
			throw new RoomNotFoundError('Room not found', { rid: message.rid });
		}

		const subData = ChatSubscription.findOne({ 'rid': room._id, 'u._id': Meteor.userId() });
		const roomURL = roomCoordinator.getURL(room.t, { ...(subData || room), tab: '' });
		return `${roomURL}?msg=${mid}`;
	}
})();

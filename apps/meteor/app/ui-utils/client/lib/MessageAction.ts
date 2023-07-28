import type { IMessage, IUser, ISubscription, IRoom, SettingValue, Serialized, ITranslatedMessage } from '@rocket.chat/core-typings';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import mem from 'mem';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import type { ContextType } from 'react';

import type { AutoTranslateOptions } from '../../../../client/views/room/MessageList/hooks/useAutoTranslate';
import type { ChatContext } from '../../../../client/views/room/contexts/ChatContext';
import type { ToolboxContextValue } from '../../../../client/views/room/contexts/ToolboxContext';

export const getMessage = async (msgId: string): Promise<Serialized<IMessage> | null> => {
	try {
		const { sdk } = await import('../../../utils/client/lib/SDKClient');
		const { message } = await sdk.rest.get('/v1/chat.getMessage', { msgId });
		return message;
	} catch {
		return null;
	}
};

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

type MessageActionConditionProps = {
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

class MessageAction {
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

	updateButton(id: MessageActionConfig['id'], config: MessageActionConfig): void {
		return Tracker.nonreactive(() => {
			const btns = this.buttons.get();
			if (btns[id]) {
				btns[id] = Object.assign(btns[id], config);
				return this.buttons.set(btns);
			}
		});
	}

	getButtonById(id: MessageActionConfig['id']): MessageActionConfig | undefined {
		const allButtons = this.buttons.get();
		return allButtons[id];
	}

	_getButtons = mem((): MessageActionConfigList => Object.values(this.buttons.get()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), {
		maxAge: 1000,
	});

	async getButtonsByCondition(
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

	getButtonsByGroup = mem(
		(group: MessageActionGroup, arr: MessageActionConfigList = this._getButtons()): MessageActionConfigList => {
			return arr.filter((button) => !button.group || (Array.isArray(button.group) ? button.group.includes(group) : button.group === group));
		},
		{ maxAge: 1000 },
	);

	getButtonsByContext(context: MessageActionContext, arr: MessageActionConfigList): MessageActionConfigList {
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

	resetButtons(): void {
		mem.clear(this._getButtons);
		mem.clear(this.getButtonsByGroup);
		return this.buttons.set({});
	}
}

const instance = new MessageAction();

export { instance as MessageAction };

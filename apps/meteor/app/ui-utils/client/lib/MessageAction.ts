import type { IMessage, IUser, ISubscription, IRoom, SettingValue, ITranslatedMessage } from '@rocket.chat/core-typings';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import mem from 'mem';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import type { ContextType } from 'react';

import type { AutoTranslateOptions } from '../../../../client/views/room/MessageList/hooks/useAutoTranslate';
import type { ChatContext } from '../../../../client/views/room/contexts/ChatContext';
import type { ToolboxContextValue } from '../../../../client/views/room/contexts/ToolboxContext';

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
		this: any,
		e: Pick<Event, 'preventDefault' | 'stopPropagation' | 'currentTarget'>,
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

class MessageAction {
	public buttons = new ReactiveVar<Record<string, MessageActionConfig>>({});

	public addButton(config: MessageActionConfig): void {
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
			return this.buttons.set(btns);
		});
	}

	public removeButton(id: MessageActionConfig['id']): void {
		return Tracker.nonreactive(() => {
			const btns = this.buttons.get();
			delete btns[id];
			return this.buttons.set(btns);
		});
	}

	public async getAll(
		props: MessageActionConditionProps,
		context: MessageActionContext,
		group: MessageActionGroup,
	): Promise<MessageActionConfig[]> {
		return (
			await Promise.all(
				Object.values(this.buttons.get())
					.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
					.filter((button) => !button.group || (Array.isArray(button.group) ? button.group.includes(group) : button.group === group))
					.filter((button) => !button.context || button.context.includes(context))
					.map(async (button) => {
						return [button, !button.condition || (await button.condition({ ...props, context }))] as const;
					}),
			)
		)
			.filter(([, condition]) => condition)
			.map(([button]) => button);
	}
}

const instance = new MessageAction();

export { instance as MessageAction };

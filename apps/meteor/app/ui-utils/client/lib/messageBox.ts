import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

import type { ChatAPI } from '../../../../client/lib/chats/ChatAPI';

export type MessageBoxAction = {
	label: TranslationKey;
	id: string;
	icon: IconName;
	action: (params: { rid: IRoom['_id']; tmid?: IMessage['_id']; event: Event; chat: ChatAPI }) => void;
	condition?: () => boolean;
};

class MessageBoxActions {
	actions: Map<TranslationKey, MessageBoxAction[]> = new Map();

	add(group: TranslationKey, label: TranslationKey, config: Omit<MessageBoxAction, 'label'>) {
		if (!group && !label && !config) {
			return;
		}

		if (!this.actions.has(group)) {
			this.actions.set(group, []);
		}

		const actionExists = this.actions.get(group)?.find((action) => action.label === label);

		if (actionExists) {
			return;
		}

		this.actions.get(group)?.push({ ...config, label });
	}

	remove(group: TranslationKey, expression: RegExp) {
		if (!group || !this.actions.get(group)) {
			return false;
		}

		this.actions.set(group, this.actions.get(group)?.filter((action) => !expression.test(action.id)) || []);
		return this.actions.get(group);
	}

	get(): Record<TranslationKey, MessageBoxAction[]>;

	get(group: TranslationKey): MessageBoxAction[];

	get(group?: TranslationKey) {
		if (!group) {
			return [...this.actions.entries()].reduce<Record<TranslationKey, MessageBoxAction[]>>((ret, [group, actions]) => {
				const filteredActions = actions.filter((action) => !action.condition || action.condition());
				if (filteredActions.length) {
					ret[group] = filteredActions;
				}
				return ret;
			}, {} as Record<TranslationKey, MessageBoxAction[]>);
		}

		return this.actions.get(group)?.filter((action) => !action.condition || action.condition());
	}

	getById(id: MessageBoxAction['id']) {
		return Object.values(this.actions)
			.flat()
			.filter((action) => action.id === id);
	}
}

export const messageBox = {
	actions: new MessageBoxActions(),
} as const;

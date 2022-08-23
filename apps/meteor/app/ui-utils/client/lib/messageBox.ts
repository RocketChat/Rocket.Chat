import type { IMessage, IRoom } from '@rocket.chat/core-typings';

type MessageBoxAction = {
	label: string;
	id: string;
	icon?: string;
	action: (params: { rid: IRoom['_id']; tmid?: IMessage['_id']; event: Event; messageBox: HTMLElement }) => void;
	condition?: () => boolean;
};

export class MessageBoxActions {
	actions: Record<string, MessageBoxAction[]> = {};

	add(group: string, label: string, config: Omit<MessageBoxAction, 'label'>) {
		if (!group && !label && !config) {
			return;
		}

		if (!this.actions[group]) {
			this.actions[group] = [];
		}

		const actionExists = this.actions[group].find((action) => action.label === label);

		if (actionExists) {
			return;
		}

		this.actions[group].push({ ...config, label });
	}

	remove(group: string, expression: RegExp) {
		if (!group || !this.actions[group]) {
			return false;
		}

		this.actions[group] = this.actions[group].filter((action) => !expression.test(action.id));
		return this.actions[group];
	}

	get(): Record<string, MessageBoxAction[]>;

	get(group: string): MessageBoxAction[];

	get(group?: string) {
		if (!group) {
			return Object.entries(this.actions).reduce<Record<string, MessageBoxAction[]>>((ret, [group, actions]) => {
				const filteredActions = actions.filter((action) => !action.condition || action.condition());
				if (filteredActions.length) {
					ret[group] = filteredActions;
				}
				return ret;
			}, {});
		}

		return this.actions[group].filter((action) => !action.condition || action.condition());
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

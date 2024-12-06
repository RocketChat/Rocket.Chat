import type { Keys as IconName } from '@rocket.chat/icons';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import mem from 'mem';

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
	| 'search'
	| 'videoconf-threads';

type MessageActionType = 'communication' | 'interaction' | 'duplication' | 'apps' | 'management';

export type MessageActionConfig = {
	id: string;
	icon: IconName;
	variant?: 'danger' | 'success' | 'warning';
	label: TranslationKey;
	order: number;
	/* @deprecated */
	color?: 'alert';
	group: MessageActionGroup;
	context?: MessageActionContext[];
	action: (e: Pick<Event, 'preventDefault' | 'stopPropagation' | 'currentTarget'> | undefined) => any;
	condition?: () => Promise<boolean> | boolean;
	type?: MessageActionType;
	disabled?: boolean;
};

class MessageAction {
	private buttons: Record<MessageActionConfig['id'], MessageActionConfig> = {};

	public addButton(config: MessageActionConfig): void {
		if (!config?.id) {
			return;
		}

		if (config.condition) {
			config.condition = mem(config.condition, { maxAge: 1000, cacheKey: JSON.stringify });
		}

		this.buttons[config.id] = config;
	}

	public removeButton(id: MessageActionConfig['id']): void {
		delete this.buttons[id];
	}

	public async getAll(context: MessageActionContext, group: MessageActionGroup): Promise<MessageActionConfig[]> {
		return (
			await Promise.all(
				Object.values(this.buttons)
					.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
					.filter((button) => button.group === group)
					.filter((button) => !button.context || button.context.includes(context))
					.map(async (button) => {
						return [button, !button.condition || (await button.condition())] as const;
					}),
			)
		)
			.filter(([, condition]) => condition)
			.map(([button]) => button);
	}
}

const instance = new MessageAction();

export { instance as MessageAction };

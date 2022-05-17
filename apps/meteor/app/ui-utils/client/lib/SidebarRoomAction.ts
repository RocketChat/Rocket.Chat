import { IUActionButtonWhen, IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import { Emitter, OffCallbackHandler } from '@rocket.chat/emitter';

import { triggerActionButtonAction } from '../../../ui-message/client/ActionManager';

interface ISidebarButton {
	[key: string]: {
		label: { label: string };
		actionId: string;
		appId: string;
		action?: () => Promise<void>;
		when?: IUActionButtonWhen;
	};
}
export interface ISideBarActionItem extends IUIActionButton {
	sidebarActionButton?: ISidebarButton;
}

export class SidebarRoomActionBase {
	private items: ISideBarActionItem[];

	private emitter = new Emitter<{
		update: void;
	}>();

	public actions = {
		getCurrentValue: (): ISideBarActionItem[] => {
			return this.items ?? [];
		},
		subscribe:
			(listener: () => void): (() => void) =>
			(): OffCallbackHandler =>
				this.emitter.on('update', listener),
		addItem: (value: ISideBarActionItem): void => {
			this.addItem(value);
			this.emitter.emit('update');
		},
		removeItem: (value: ISideBarActionItem): void => {
			this.deleteItem(value);
			this.emitter.emit('update');
		},
	};

	private addItem(newItem: IUIActionButton): void {
		const actual = this.actions.getCurrentValue();
		actual.push(this.parseButton(newItem));
		this.items = actual;
	}

	private deleteItem(item: IUIActionButton): void {
		const actual = this.actions.getCurrentValue();
		const itemIndex = actual.findIndex((actualItem: ISideBarActionItem) => actualItem.appId.toString() === item.appId);
		actual.splice(itemIndex, 1);
		this.items = actual;
	}

	private parseButton(buttonInfo: ISideBarActionItem): ISideBarActionItem {
		return {
			[buttonInfo.actionId]: {
				label: { label: buttonInfo.labelI18n },
				actionId: buttonInfo.actionId,
				appId: buttonInfo.appId,
				action: async (): Promise<void> => {
					triggerActionButtonAction({
						actionId: buttonInfo.actionId,
						appId: buttonInfo.appId,
						payload: { context: buttonInfo.context },
					});
				},
			},
			...buttonInfo,
		};
	}
}

export const SidebarRoomAction = new SidebarRoomActionBase();

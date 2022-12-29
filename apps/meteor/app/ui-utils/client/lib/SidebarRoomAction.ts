import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import { Emitter } from '@rocket.chat/emitter';
import type { OffCallbackHandler } from '@rocket.chat/emitter';

import { triggerActionButtonAction } from '../../../ui-message/client/ActionManager';

export interface ISidebarButton {
	label: { label: string };
	actionId: string;
	appId: string;
	action?: () => void;
}
export interface ISideBarActionItem extends IUIActionButton {
	sidebarActionButton: ISidebarButton;
}

export class SidebarRoomActionBase {
	private items: ISideBarActionItem[] = [];

	private emitter = new Emitter<{
		update: void;
	}>();

	public actions = {
		getCurrentValue: (): ISideBarActionItem[] => {
			return this.items;
		},
		subscribe:
			(listener: () => void): (() => void) =>
			(): OffCallbackHandler =>
				this.emitter.on('update', listener),
		addItem: (value: IUIActionButton): void => {
			this.addItem(value);
			this.emitter.emit('update');
		},
		removeItem: (value: IUIActionButton): void => {
			this.deleteItem(value);
			this.emitter.emit('update');
		},
	};

	private addItem(newItem: IUIActionButton): void {
		const actual = this.actions.getCurrentValue();
		actual.push(this.parseButton(newItem));
	}

	private deleteItem(item: IUIActionButton): void {
		const actual = this.actions.getCurrentValue();
		const itemIndex = actual.findIndex((actualItem: ISideBarActionItem) => actualItem.appId.toString() === item.appId);
		actual.splice(itemIndex, 1);
	}

	private parseButton(buttonInfo: IUIActionButton): ISideBarActionItem {
		return {
			...buttonInfo,
			sidebarActionButton: {
				label: { label: buttonInfo.labelI18n },
				actionId: buttonInfo.actionId,
				appId: buttonInfo.appId,
				action: (): void => {
					triggerActionButtonAction({
						actionId: buttonInfo.actionId,
						appId: buttonInfo.appId,
						payload: { context: buttonInfo.context },
					});
				},
			},
		};
	}
}

export const SidebarRoomAction = new SidebarRoomActionBase();

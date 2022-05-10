import { IUActionButtonWhen, IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import { Emitter, OffCallbackHandler } from '@rocket.chat/emitter';
import { Tracker } from 'meteor/tracker';

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

export class SidebarRoomAction {
	private static items: ISideBarActionItem[];

	private static emitter = new Emitter<{
		update: void;
	}>();

	public static actions = {
		getCurrentValue: (): ISideBarActionItem[] => {
			return this.items ?? [];
		},
		subscribe:
			(listener: () => void): (() => void) =>
			(): OffCallbackHandler =>
				this.emitter.on('update', listener),
		setValue: (value: ISideBarActionItem, toDelete = false): void => {
			if (toDelete) {
				this.deleteItem(value);
				return this.emitter.emit('update');
			}
			this.addItem(value);
			return this.emitter.emit('update');
		},
	};

	private static async addItem(newItem: IUIActionButton): Promise<void> {
		Tracker.nonreactive(() => {
			const actual = this.actions.getCurrentValue();
			actual.push(this.parseButton(newItem));
			this.items = actual;
		});
	}

	private static async deleteItem(item: IUIActionButton): Promise<void> {
		Tracker.nonreactive(() => {
			const actual = this.actions.getCurrentValue();
			const itemIndex = actual.findIndex((actualItem: ISideBarActionItem) => actualItem.appId.toString() === item.appId);
			actual.splice(itemIndex, 1);
			this.items = actual;
		});
	}

	private static parseButton(buttonInfo: ISideBarActionItem): ISideBarActionItem {
		return {
			[buttonInfo.actionId as unknown as string]: {
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

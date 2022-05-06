import { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

import { triggerActionButtonAction } from '../../../ui-message/client/ActionManager';

export interface ISideBarActionItem {
	[key: string]: {
		label: { label: string };
		action?: () => Promise<void>;
	};
}

export class SidebarRoomAction {
	private static items = new ReactiveVar([]);

	public static async addItem(newItem: IUIActionButton): Promise<void> {
		Tracker.nonreactive(function () {
			const actual = SidebarRoomAction.items.get();
			actual.push(newItem as never);
			SidebarRoomAction.items.set(actual);
		});
	}

	public static async deleteItem(item: IUIActionButton): Promise<void> {
		Tracker.nonreactive(function () {
			const actual = SidebarRoomAction.items.get() as IUIActionButton[];
			const itemIndex = actual.findIndex((actualItem: IUIActionButton) => actualItem.appId === item.appId);
			actual.splice(itemIndex, 1);
			SidebarRoomAction.items.set(actual as never[]);
		});
	}

	public static getItems(): ISideBarActionItem[] | null {
		const items = SidebarRoomAction.items.get();

		if (items.length <= 0) {
			return null;
		}

		return items.map((item: IUIActionButton) => {
			return {
				[item.actionId]: {
					label: item.labelI18n,
					action: async (): Promise<void> => {
						triggerActionButtonAction({
							actionId: item.actionId,
							appId: item.appId,
							payload: { context: item.context },
						});
					},
				},
			} as unknown as ISideBarActionItem;
		});
	}
}

import { IUIActionButton, IUActionButtonWhen } from '@rocket.chat/apps-engine/definition/ui/IUIActionButtonDescriptor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';

import { SideNav } from './SideNav';
import { applyDropdownActionButtonFilters } from '../../../ui-message/client/actionButtons/lib/applyButtonFilters';

export interface IAppAccountBoxItem extends IUIActionButton {
	name: string;
	icon?: string;
	href?: string;
	sideNav?: string;
	isAppButtonItem?: boolean;
	subItems?: [IAppAccountBoxItem];
	when?: Omit<IUActionButtonWhen, 'roomTypes' | 'messageActionContext'>;
}

type AccountBoxItem = {
	name: string;
	icon: string;
	href: string;
	sideNav?: string;
	condition: () => boolean;
};

export const isAppAccountBoxItem = (item: IAppAccountBoxItem | AccountBoxItem): item is IAppAccountBoxItem => 'isAppButtonItem' in item;

export class AccountBoxBase {
	private items = new ReactiveVar<IAppAccountBoxItem[]>([]);

	private status = 0;

	public setStatus(status: number, statusText: string): any {
		return Meteor.call('setUserStatus', status, statusText);
	}

	public open(): void {
		if (SideNav.flexStatus()) {
			SideNav.closeFlex();
			return;
		}
		this.status = 1;
	}

	public close(): void {
		this.status = 0;
	}

	public toggle(): Window | null | void {
		if (this.status) {
			return this.close();
		}
		return this.open();
	}

	public openFlex(): void {
		this.status = 0;
	}

	public async addItem(newItem: IAppAccountBoxItem): Promise<void> {
		Tracker.nonreactive(() => {
			const actual = this.items.get();
			actual.push(newItem);
			this.items.set(actual);
		});
	}

	public async deleteItem(item: IAppAccountBoxItem): Promise<void> {
		Tracker.nonreactive(() => {
			const actual = this.items.get();
			const itemIndex = actual.findIndex((actualItem: IAppAccountBoxItem) => actualItem.appId === item.appId);
			actual.splice(itemIndex, 1);
			this.items.set(actual);
		});
	}

	public getItems(): (IAppAccountBoxItem | AccountBoxItem)[] {
		return this.items.get().filter((item: IAppAccountBoxItem | AccountBoxItem) => {
			if ('condition' in item) {
				return item.condition();
			}

			return applyDropdownActionButtonFilters(item);
		});
	}
}

export const AccountBox = new AccountBoxBase();

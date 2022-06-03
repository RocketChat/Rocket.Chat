import { IUActionButtonWhen, IUIActionButton } from '@rocket.chat/apps-engine/definition/ui/IUIActionButtonDescriptor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';

import { SideNav } from './SideNav';
import { applyDropdownActionButtonFilters } from '../../../ui-message/client/actionButtons/lib/applyButtonFilters';

export interface IAccountBoxItem extends Omit<IUIActionButton, 'when'> {
	name: string;
	icon?: string;
	href?: string;
	sideNav?: string;
	isAppButtonItem?: boolean;
	subItems?: [IAccountBoxItem];
	when?: Omit<IUActionButtonWhen, 'roomTypes' | 'messageActionContext'>;
}

export class AccountBoxBase {
	private items = new ReactiveVar([]);

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

	public async addItem(newItem: IAccountBoxItem): Promise<void> {
		Tracker.nonreactive(() => {
			const actual = this.items.get();
			actual.push(newItem as never);
			this.items.set(actual);
		});
	}

	public async deleteItem(item: IAccountBoxItem): Promise<void> {
		Tracker.nonreactive(() => {
			const actual = this.items.get();
			const itemIndex = actual.findIndex((actualItem: IAccountBoxItem) => actualItem.appId === item.appId);
			actual.splice(itemIndex, 1);
			this.items.set(actual);
		});
	}

	public getItems(): IAccountBoxItem[] {
		return this.items.get().filter((item: IAccountBoxItem) => applyDropdownActionButtonFilters(item));
	}
}

export const AccountBox = new AccountBoxBase();

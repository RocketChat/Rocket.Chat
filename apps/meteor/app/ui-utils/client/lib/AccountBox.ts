import { IUActionButtonWhen, IUIActionButton } from '@rocket.chat/apps-engine/definition/ui/IUIActionButtonDescriptor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';
import { FlowRouter, Router } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';

import { SideNav } from './SideNav';
import { appLayout } from '../../../../client/lib/appLayout';
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

export class AccountBox {
	private static items = new ReactiveVar([]);

	private static status = 0;

	public static setStatus(status: number, statusText: string): any {
		return Meteor.call('setUserStatus', status, statusText);
	}

	public static open(): void {
		if (SideNav.flexStatus()) {
			SideNav.closeFlex();
			return;
		}
		AccountBox.status = 1;
	}

	public static close(): void {
		AccountBox.status = 0;
	}

	public static toggle(): Window | null | void {
		if (AccountBox.status) {
			return close();
		}
		return open();
	}

	public static openFlex(): void {
		AccountBox.status = 0;
	}

	public static async onAdded(button: IUIActionButton): Promise<void> {
		const { appId, actionId, labelI18n, context } = button;
		await AccountBox.addItem({
			...button,
			name: button.labelI18n,
			appId,
			actionId,
			labelI18n,
			context,
			isAppButtonItem: true,
		});
	}

	public static async onRemoved(button: IUIActionButton): Promise<void> {
		const { appId, actionId, labelI18n, context } = button;
		AccountBox.deleteItem({
			...button,
			name: button.labelI18n,
			appId,
			actionId,
			labelI18n,
			context,
			isAppButtonItem: true,
		});
	}

	public static async addItem(newItem: IAccountBoxItem): Promise<void> {
		Tracker.nonreactive(function () {
			const actual = AccountBox.items.get();
			actual.push(newItem as never);
			AccountBox.items.set(actual);
		});
	}

	public static async deleteItem(item: IAccountBoxItem): Promise<void> {
		Tracker.nonreactive(function () {
			const actual = AccountBox.items.get();
			const itemIndex = actual.findIndex((actualItem: IAccountBoxItem) => actualItem.appId === item.appId);
			actual.splice(itemIndex, 1);
			AccountBox.items.set(actual);
		});
	}

	public static getItems(): IAccountBoxItem[] {
		return AccountBox.items.get().filter((item: IAccountBoxItem) => applyDropdownActionButtonFilters(item));
	}

	public static addRoute(newRoute: any, router: any, wait = async (): Promise<null> => null): Router {
		if (router == null) {
			router = FlowRouter;
		}
		const container = newRoute.customContainer ? 'pageCustomContainer' : 'pageContainer';
		const routeConfig = {
			center: container,
			pageTemplate: newRoute.pageTemplate,
			i18nPageTitle: '',
			pageTitle: '',
		};

		if (newRoute.i18nPageTitle != null) {
			routeConfig.i18nPageTitle = newRoute.i18nPageTitle;
		}

		if (newRoute.pageTitle != null) {
			routeConfig.pageTitle = newRoute.pageTitle;
		}

		return router.route(newRoute.path, {
			name: newRoute.name,
			async action() {
				await wait();
				Session.set('openedRoom', null);
				appLayout.renderMainLayout(routeConfig);
			},
			triggersEnter: [
				function (): void {
					if (newRoute.sideNav != null) {
						SideNav.setFlex(newRoute.sideNav);
						SideNav.openFlex();
					}
				},
			],
		});
	}
}

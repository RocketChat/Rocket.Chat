import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Emitter } from '@rocket.chat/emitter';

import { Subscriptions } from '../../../models/client';
import { RoomManager } from '../../../../client/lib/RoomManager';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';

export const SideNav = new (class extends Emitter<{
	changed: undefined;
}> {
	private opened = false;

	private initiated = false;

	private openQueue: {
		config: {
			template?: string;
			data: Record<string, unknown>;
		};
		callback: () => void;
	}[] = [];

	private animating = false;

	private sideNav: JQuery<HTMLElement>;

	private flexNav: JQuery<HTMLElement>;

	toggleFlex(status: 1 | -1, callback?: () => void): void {
		if (this.animating === true) {
			return;
		}

		this.animating = true;

		if (status === -1 || (status !== 1 && this.opened)) {
			this.opened = false;
			this.flexNav.addClass('animated-hidden');
		} else {
			this.opened = true;
			this.flexNav.removeClass('animated-hidden');
		}

		this.emit('changed');

		!this.opened && this.setFlex();
		this.animating = false;
		typeof callback === 'function' && callback();
	}

	closeFlex(callback: () => void = (): void => undefined): void {
		const routeName = FlowRouter.current().route?.name;
		if (!routeName || !roomCoordinator.isRouteNameKnown(routeName)) {
			const subscription = Subscriptions.findOne({ rid: RoomManager.lastRid });
			if (subscription) {
				roomCoordinator.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
			} else {
				FlowRouter.go('home');
			}
		}
		if (this.animating === true) {
			return;
		}
		this.toggleFlex(-1, callback);
	}

	flexStatus(): boolean {
		return this.opened;
	}

	setFlex(template?: string, data = {}): void {
		Session.set('flex-nav-template', template);
		return Session.set('flex-nav-data', data);
	}

	getFlex(): {
		template?: string;
		data: Record<string, unknown>;
	} {
		return {
			template: Session.get('flex-nav-template'),
			data: Session.get('flex-nav-data'),
		};
	}

	openFlex(callback = (): void => undefined): void {
		if (!this.initiated) {
			this.openQueue.push({
				config: this.getFlex(),
				callback,
			});
			return;
		}
		if (this.animating === true) {
			return;
		}
		this.toggleFlex(1, callback);
	}

	init(): void {
		this.sideNav = $('.sidebar');
		this.flexNav = this.sideNav.find('.flex-nav');
		this.setFlex('');
		this.initiated = true;
		if (this.openQueue.length > 0) {
			this.openQueue.forEach((item) => {
				this.setFlex(item.config.template, item.config.data);
				return this.openFlex(item.callback);
			});
			this.openQueue = [];
		}
	}
})();

import { Emitter } from '@rocket.chat/emitter';
import { createElement, lazy, ReactElement } from 'react';
import { Subscription, Unsubscribe } from 'use-subscription';

export const MainLayout = lazy(() => import('../views/root/MainLayout'));
export const BlazeTemplate = lazy(() => import('../views/root/BlazeTemplate'));

type AppLayoutDescriptor = ReactElement | null;

class AppLayoutSubscription extends Emitter<{ update: void }> implements Subscription<AppLayoutDescriptor> {
	private descriptor: AppLayoutDescriptor = null;

	getCurrentValue = (): AppLayoutDescriptor => this.descriptor;

	subscribe = (callback: () => void): Unsubscribe => this.on('update', callback);

	setCurrentValue(descriptor: AppLayoutDescriptor): void {
		this.descriptor = descriptor;
		this.emit('update');
	}

	/** @deprecated */
	renderMainLayout({ center }: { center?: string } = {}): void {
		this.setCurrentValue(createElement(MainLayout, {}, center ? createElement(BlazeTemplate, { template: center }) : null));
	}

	render(element: ReactElement): void {
		this.setCurrentValue(element);
	}
}

export const appLayout = new AppLayoutSubscription();

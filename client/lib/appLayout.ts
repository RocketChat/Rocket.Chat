import { Emitter } from '@rocket.chat/emitter';
import { ComponentType } from 'react';
import { Subscription, Unsubscribe } from 'use-subscription';

type ComponentLayoutDescriptor<Props extends {} = {}> = {
	component: ComponentType<Props>;
	props?: Props;
};

type AppLayoutDescriptor = ComponentLayoutDescriptor | null;

class AppLayoutSubscription extends Emitter<{ update: void }> implements Subscription<AppLayoutDescriptor> {
	private descriptor: AppLayoutDescriptor = null;

	getCurrentValue = (): AppLayoutDescriptor => this.descriptor;

	subscribe = (callback: () => void): Unsubscribe => this.on('update', callback);

	setCurrentValue(descriptor: AppLayoutDescriptor): void {
		this.descriptor = descriptor;
		this.emit('update');
	}

	render = <Props = {}>(descriptor: ComponentLayoutDescriptor<Props>): void => {
		this.setCurrentValue(descriptor as ComponentLayoutDescriptor);
	};

	reset = (): void => {
		this.setCurrentValue(null);
	};
}

export const appLayout = new AppLayoutSubscription();

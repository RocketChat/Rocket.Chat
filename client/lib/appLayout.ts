import { Emitter } from '@rocket.chat/emitter';
import { ComponentType } from 'react';
import { Subscription, Unsubscribe } from 'use-subscription';

type BlazeLayoutDescriptor = {
	template: string;
	regions?: { [region: string]: string };
};

type ComponentLayoutDescriptor<Props extends {} = {}> = {
	component: ComponentType<Props>;
	props?: Props;
};

type AppLayoutDescriptor = BlazeLayoutDescriptor | ComponentLayoutDescriptor | null;

class AppLayoutSubscription
	extends Emitter<{ update: void }>
	implements Subscription<AppLayoutDescriptor> {
	private descriptor: AppLayoutDescriptor = null;

	getCurrentValue = (): AppLayoutDescriptor => this.descriptor;

	subscribe = (callback: () => void): Unsubscribe => this.on('update', callback);

	setCurrentValue(descriptor: AppLayoutDescriptor): void {
		this.descriptor = descriptor;
		this.emit('update');
	}

	render: {
		(template: string, regions?: { [region: string]: string }): void;
		(descriptor: BlazeLayoutDescriptor): void;
		<Props = {}>(descriptor: ComponentLayoutDescriptor<Props>): void;
	} = (
		templateOrDescriptor: string | AppLayoutDescriptor,
		regions?: { [region: string]: string },
	): void => {
		if (typeof templateOrDescriptor === 'string') {
			this.setCurrentValue({ template: templateOrDescriptor, regions });
			return;
		}

		this.setCurrentValue(templateOrDescriptor);
	};

	reset = (): void => {
		this.setCurrentValue(null);
	};
}

export const appLayout = new AppLayoutSubscription();

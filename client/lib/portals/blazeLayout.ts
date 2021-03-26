import { Emitter } from '@rocket.chat/emitter';
import { Subscription, Unsubscribe } from 'use-subscription';

export type BlazeLayoutDescriptor = {
	template: string;
	regions?: { [region: string]: string };
};

class BlazeLayoutSubscription
	extends Emitter<{ update: void }>
	implements Subscription<BlazeLayoutDescriptor | null> {
	private descriptor: BlazeLayoutDescriptor | null = null;

	getCurrentValue(): BlazeLayoutDescriptor | null {
		return this.descriptor;
	}

	setCurrentValue(descriptor: BlazeLayoutDescriptor | null): void {
		this.descriptor = descriptor;
		this.emit('update');
	}

	subscribe(callback: () => void): Unsubscribe {
		return this.on('update', callback);
	}
}

export const subscription = new BlazeLayoutSubscription();

export const render = (template: string, regions?: { [region: string]: string }): void => {
	subscription.setCurrentValue({ template, regions });
};

export const reset = (): void => {
	subscription.setCurrentValue(null);
};

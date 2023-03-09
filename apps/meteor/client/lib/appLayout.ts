import { Emitter } from '@rocket.chat/emitter';
import type { ReactElement } from 'react';

type AppLayoutDescriptor = ReactElement | null;

class AppLayoutSubscription extends Emitter<{ update: void }> {
	private descriptor: AppLayoutDescriptor = null;

	getSnapshot = (): AppLayoutDescriptor => this.descriptor;

	subscribe = (onStoreChange: () => void): (() => void) => this.on('update', onStoreChange);

	setCurrentValue(descriptor: AppLayoutDescriptor): void {
		this.descriptor = descriptor;
		this.emit('update');
	}

	render(element: ReactElement): void {
		this.setCurrentValue(element);
	}
}

export const appLayout = new AppLayoutSubscription();

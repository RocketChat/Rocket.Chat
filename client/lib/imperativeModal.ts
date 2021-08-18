import { Emitter } from '@rocket.chat/emitter';
import { ComponentType } from 'react';
import { Subscription, Unsubscribe } from 'use-subscription';

type BlazeModalOptions = {
	confirmButtonText?: string;
	cancelButtonText?: string;
	showCancelButton?: boolean;
	confirmButtonColor?: string;
	cancelButtonColor?: string;

	allowOutsideClick?: boolean;
	confirmOnEnter?: boolean;

	closeOnConfirm?: boolean;
	closeOnEscape?: boolean;

	type?: 'input';
	inputType?: 'text' | 'password';
	inputActionText?: string;
	inputAction?: () => any;
	inputPlaceholder?: string;

	modalIcon?: string;

	timer?: number;
	dontAskAgain?: {
		action: string;
		label: string;
	};

	data?: Record<string, any>;
	content?: string;
	template?: string;

	title?: string;
	text?: string;
	html?: boolean;
};

type BlazeModalDescriptor = {
	options: BlazeModalOptions;
	confirmFn?: () => any;
	cancelFn?: () => any;
};

type ReactModalDescriptor<Props extends {} = {}> = {
	component: ComponentType<Props>;
	props?: Props;
};

type ModalDescriptor = BlazeModalDescriptor | ReactModalDescriptor | null;

class ImperativeModalSubscription
	extends Emitter<{ update: void }>
	implements Subscription<ModalDescriptor>
{
	private descriptor: ModalDescriptor = null;

	getCurrentValue = (): ModalDescriptor => this.descriptor;

	subscribe = (callback: () => void): Unsubscribe => this.on('update', callback);

	setCurrentValue(descriptor: ModalDescriptor): void {
		this.descriptor = descriptor;
		this.emit('update');
	}

	open: {
		(descriptor: BlazeModalDescriptor): void;
		<Props = {}>(descriptor: ReactModalDescriptor<Props>): void;
	} = (templateOrDescriptor: ModalDescriptor): void => {
		this.setCurrentValue(templateOrDescriptor);
	};

	close = (): void => {
		this.setCurrentValue(null);
	};
}

export const imperativeModal = new ImperativeModalSubscription();

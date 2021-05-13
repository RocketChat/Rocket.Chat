import { Emitter } from '@rocket.chat/emitter';
import { Subscription, Unsubscribe } from 'use-subscription';

type ValueSubscription<T> = Subscription<T> & {
	setCurrentValue: (value: T) => void;
};

export const createValueSubscription = <T>(initialValue: T): ValueSubscription<T> => {
	let value: T = initialValue;
	const emitter = new Emitter<{
		update: undefined;
	}>();

	return {
		getCurrentValue: (): T => value,
		setCurrentValue: (_value: T): void => {
			value = _value;
			emitter.emit('update');
		},
		subscribe: (callback): Unsubscribe => emitter.on('update', callback),
	};
};

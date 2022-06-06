/* eslint-disable @typescript-eslint/no-empty-interface */
import { ReactElement } from 'react';
import { Unsubscribe, useSubscription, Subscription } from 'use-subscription';

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface EEFormHooks {}

const createFormSubscription = (): {
	registerForm: (form: EEFormHooks) => void;
	unregisterForm: (form: keyof EEFormHooks) => void;
	formsSubscription: Subscription<EEFormHooks>;
	getForm: (form: keyof EEFormHooks) => () => ReactElement;
} => {
	let forms = {} as EEFormHooks;
	let updateCb = (): void => undefined;

	const formsSubscription: Subscription<EEFormHooks> = {
		subscribe: (cb: () => void): Unsubscribe => {
			updateCb = cb;
			return (): void => {
				updateCb = (): void => undefined;
			};
		},
		getCurrentValue: (): EEFormHooks => forms,
	};
	const registerForm = (newForm: EEFormHooks): void => {
		forms = { ...forms, ...newForm };
		updateCb();
	};
	const unregisterForm = (form: keyof EEFormHooks): void => {
		delete forms[form];
		updateCb();
	};

	const getForm = (form: keyof EEFormHooks): (() => ReactElement) => (forms as any)[form] as any;

	return { registerForm, unregisterForm, formsSubscription, getForm };
};

export const { registerForm, unregisterForm, formsSubscription, getForm } = createFormSubscription();

export const useFormsSubscription = (): EEFormHooks => useSubscription(formsSubscription);

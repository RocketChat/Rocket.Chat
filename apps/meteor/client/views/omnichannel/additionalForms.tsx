import { ReactElement } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

/* eslint-disable @typescript-eslint/no-empty-interface */
export interface EEFormHooks {}

const createFormSubscription = (): {
	registerForm: (form: EEFormHooks) => void;
	unregisterForm: (form: keyof EEFormHooks) => void;
	formsSubscription: readonly [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => EEFormHooks];
	getForm: (form: keyof EEFormHooks) => () => ReactElement;
} => {
	let forms = {} as EEFormHooks;
	let updateCb = (): void => undefined;

	const formsSubscription = [
		(cb: () => void): (() => void) => {
			updateCb = cb;
			return (): void => {
				updateCb = (): void => undefined;
			};
		},
		(): EEFormHooks => forms,
	] as const;

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

const { registerForm, unregisterForm, formsSubscription, getForm } = createFormSubscription();

export { registerForm, unregisterForm, getForm };

export const useFormsSubscription = (): EEFormHooks => useSyncExternalStore(...formsSubscription);

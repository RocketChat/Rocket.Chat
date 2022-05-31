import { createContext, ReactNode } from 'react';

type ModalConfiguration = {
	type?: 'rc-game' | 'success' | 'input' | 'warning' | 'error' | false;
	title?: string;
	text?: string;
	inputPlaceholder?: string;
	input?: boolean;
	inputType?: HTMLInputElement['type'];
	timer?: number;
	confirmButtonText?: string;
	confirmButtonColor?: string;
	cancelButtonText?: string;
	closeOnConfirm?: boolean;
	showConfirmButton?: boolean;
	showCancelButton?: boolean;
	showFooter?: boolean;
	confirmOnEnter?: boolean;
	closeOnEscape?: boolean;
	dontAskAgain?: {
		action: string;
		label: string;
	};
	html?: boolean;
};

type ModalInstance = ModalConfiguration & {
	render(): void;
	hide(): void;
	destroy(): void;
	close(): void;
	confirm(value: unknown): void;
	cancel(): void;
	showInputError(text: string): void;
};

export type ModalContextValue = {
	open(
		config?: ModalConfiguration,
		fn?: (instance: ModalInstance, value: unknown) => void,
		onCancel?: (instance: ModalInstance) => void,
	): void;
	push(
		config?: ModalConfiguration,
		fn?: (instance: ModalInstance, value: unknown) => void,
		onCancel?: (instance: ModalInstance) => void,
	): ModalInstance;
	cancel(): void;
	close(): void;
	confirm(value: unknown): void;
	showInputError(text: string): void;
	onKeyDown(event: KeyboardEvent): void;
	setModal(modal: ReactNode): void;
};

export const ModalContext = createContext<ModalContextValue>({
	open: () => undefined,
	push: () => ({
		render: (): void => undefined,
		hide: (): void => undefined,
		destroy: (): void => undefined,
		close: (): void => undefined,
		confirm: (): void => undefined,
		cancel: (): void => undefined,
		showInputError: (): void => undefined,
	}),
	cancel: () => undefined,
	close: () => undefined,
	confirm: () => undefined,
	showInputError: () => undefined,
	onKeyDown: () => undefined,
	setModal: () => undefined,
});

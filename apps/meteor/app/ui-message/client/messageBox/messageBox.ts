import './messageBoxActions';

const lastFocusedInput: HTMLTextAreaElement | undefined = undefined;

export const refocusComposer = () => {
	(lastFocusedInput ?? document.querySelector<HTMLTextAreaElement>('.js-input-message'))?.focus();
};

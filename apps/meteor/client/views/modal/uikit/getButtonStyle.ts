import type { ButtonElement } from '@rocket.chat/ui-kit';

// TODO: Move to fuselage-ui-kit
export const getButtonStyle = (buttonElement: ButtonElement): { danger: boolean } | { primary: boolean } => {
	return buttonElement?.style === 'danger' ? { danger: true } : { primary: true };
};

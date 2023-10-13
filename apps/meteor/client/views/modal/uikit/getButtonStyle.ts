import type { IButtonElement } from '@rocket.chat/apps-engine/definition/uikit';
import type { ButtonElement } from '@rocket.chat/ui-kit';

// TODO: Move to fuselage-ui-kit
export const getButtonStyle = (buttonElement: ButtonElement | IButtonElement): { danger: boolean } | { primary: boolean } => {
	return buttonElement?.style === 'danger' ? { danger: true } : { primary: true };
};

import type { ButtonElement } from '@rocket.chat/ui-kit';

// TODO: Move to fuselage-ui-kit
export const getButtonStyle = (buttonElement: ButtonElement): { variant: 'danger' | 'primary' } => {
	return { variant: buttonElement?.style === 'danger' ? 'danger' : 'primary' };
};

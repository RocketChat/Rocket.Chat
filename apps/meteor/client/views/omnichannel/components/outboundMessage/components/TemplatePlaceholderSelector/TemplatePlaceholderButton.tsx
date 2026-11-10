import type { IconButton } from '@rocket.chat/fuselage';
import { Button } from '@rocket.chat/fuselage';
import { forwardRef, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

// What the menu stamps onto its trigger: an IconButton's `icon` and `pressed`, which this button draws as its own text
export type TemplatePlaceholderButtonProps = Omit<ComponentProps<typeof Button>, 'icon' | 'variant'> & {
	icon?: ComponentProps<typeof IconButton>['icon'];
	pressed?: boolean;
};

const TemplatePlaceholderButton = forwardRef<HTMLButtonElement, TemplatePlaceholderButtonProps>(
	({ icon: _icon, pressed: _pressed, size: _size, ...props }, ref) => {
		const { t } = useTranslation();
		return (
			<Button ref={ref} {...props}>
				{t('Placeholder')}
			</Button>
		);
	},
);

TemplatePlaceholderButton.displayName = 'TemplatePlaceholderButton';

export default TemplatePlaceholderButton;

import type { IconButtonProps } from '@rocket.chat/fuselage';
import { Button } from '@rocket.chat/fuselage';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

export type TemplatePlaceholderButtonProps = Omit<IconButtonProps, 'color' | 'icon'> & {
	icon?: IconButtonProps['icon'];
};

const TemplatePlaceholderButton = forwardRef<HTMLButtonElement, TemplatePlaceholderButtonProps>(
	({ icon: _icon, pressed: _pressed, small: _small, ...props }, ref) => {
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

import type { IconButton } from '@rocket.chat/fuselage';
import { Button } from '@rocket.chat/fuselage';
import { forwardRef, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

type TemplatePlaceholderButtonProps = Omit<ComponentProps<typeof IconButton>, 'color' | 'icon'> & {
	icon?: ComponentProps<typeof IconButton>['icon'];
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

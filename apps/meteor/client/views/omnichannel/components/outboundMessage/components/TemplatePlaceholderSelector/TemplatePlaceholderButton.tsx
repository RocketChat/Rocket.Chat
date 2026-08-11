import type { IconButtonProps } from '@rocket.chat/fuselage';
import { Button } from '@rocket.chat/fuselage';
import type { RefAttributes } from 'react';
import { useTranslation } from 'react-i18next';

export type TemplatePlaceholderButtonProps = Omit<IconButtonProps, 'color' | 'icon'> & {
	icon?: IconButtonProps['icon'];
} & RefAttributes<HTMLButtonElement>;

const TemplatePlaceholderButton = ({ icon: _icon, pressed: _pressed, small: _small, ref, ...props }: TemplatePlaceholderButtonProps) => {
	const { t } = useTranslation();
	return (
		<Button ref={ref} {...props}>
			{t('Placeholder')}
		</Button>
	);
};

export default TemplatePlaceholderButton;

import type { IconButton } from '@rocket.chat/fuselage';
import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

export type InsertPlaceholderButtonProps = Omit<ComponentProps<typeof IconButton>, 'color' | 'icon' | 'variant'> & {
	icon?: ComponentProps<typeof IconButton>['icon'];
};

/**
 * The canned response composer's button that opens the placeholder menu.
 */
const InsertPlaceholderButton = forwardRef<HTMLButtonElement, InsertPlaceholderButtonProps>(function InsertPlaceholderButton(
	{ icon: _icon, pressed: _pressed, size: _size, ...props },
	ref,
) {
	const { t } = useTranslation();

	return (
		<Button ref={ref} size='small' {...props}>
			{t('Insert_Placeholder')}
		</Button>
	);
});

export default InsertPlaceholderButton;

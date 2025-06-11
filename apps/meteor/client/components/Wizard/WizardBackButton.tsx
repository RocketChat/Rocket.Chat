import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useWizardContext } from './useWizardContext';

type WizardBackButtonProps = Omit<ComponentProps<typeof Button>, 'primary' | 'onClick'> & {
	onClick?(event?: MouseEvent<HTMLElement>): unknown | Promise<unknown>;
};

const WizardBackButton = ({ children, disabled, onClick, ...props }: WizardBackButtonProps) => {
	const { t } = useTranslation();
	const { previous, currentStep } = useWizardContext();

	const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
		event.persist();

		await onClick?.(event);

		if (event.isDefaultPrevented()) {
			return;
		}

		previous();
	};

	return (
		<Button {...props} disabled={!currentStep?.prev || disabled} onClick={handleClick}>
			{children || t('Back')}
		</Button>
	);
};

export default WizardBackButton;

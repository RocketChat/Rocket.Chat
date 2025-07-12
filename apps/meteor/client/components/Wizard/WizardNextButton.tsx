import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useWizardContext } from './useWizardContext';

type WizardNextButtonProps = Omit<ComponentProps<typeof Button>, 'primary' | 'onClick'> & {
	manual?: boolean;
	onClick?(event?: MouseEvent<HTMLElement>): unknown | Promise<unknown>;
};

const WizardNextButton = ({ children, disabled = false, manual, onClick, ...props }: WizardNextButtonProps) => {
	const { t } = useTranslation();
	const { next, currentStep } = useWizardContext();

	const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
		event.persist();

		await onClick?.(event);

		if (manual || event.isDefaultPrevented()) {
			return;
		}

		next();
	};

	return (
		<Button primary {...props} disabled={!currentStep?.next || disabled} onClick={handleClick}>
			{children || t('Next')}
		</Button>
	);
};

export default WizardNextButton;

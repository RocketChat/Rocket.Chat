import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useWizardContext } from './useWizardContext';

type WizardNextButtonProps = Omit<ComponentProps<typeof Button>, 'primary' | 'onClick'> & {
	manual?: boolean;
	onClick?(event?: MouseEvent<HTMLElement>): unknown | Promise<unknown>;
};

/**
 * A specialized button for navigating to the next step within a Wizard component.
 *
 * This button is context-aware and will automatically trigger the `next` function
 * from the `WizardContext` when clicked.
 *
 * The automatic step navigation can be prevented in two ways:
 * 1. By setting the `manual` prop to `true`.
 * 2. By calling `event.preventDefault()` inside the `onClick` event handler.
 *
 * This is particularly useful when the button needs to perform another primary action,
 * such as submitting a form, before manually proceeding to the next step.
 *
 * Inherits all props from Button, except for `primary` and `onClick`, which are managed internally.
 * @param {object} props - The component's props.
 * @param {ReactNode} [props.children='Next'] - Button label.
 * @param {boolean} [props.disabled=false] - Disables the button, unless the current step does not have a next step, which always takes priority.
 * @param {boolean} [props.manual=false] - Prevents automatic navigation to the next step.
 * @param {(event?: MouseEvent<HTMLButtonElement>) => unknown | Promise<unknown>} [props.onClick] - Click handler.
 * @returns {JSX.Element} The rendered button.
 *
 * @example
 * <WizardNextButton onClick={handleAction} />
 */
const WizardNextButton = ({ children, disabled = false, manual, onClick, ...props }: WizardNextButtonProps) => {
	const { t } = useTranslation();
	const { next, currentStep } = useWizardContext();

	const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
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

import { IconButton, TextInput } from '@rocket.chat/fuselage';
import type { ChangeEvent, FocusEvent } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

type DialInputProps = {
	inputName: string;
	inputError: string | undefined;
	isButtonDisabled: boolean;
	onBlur?: (event: FocusEvent<HTMLElement, Element>) => void;
	handleBackspaceClick: () => void;
	handleOnChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

export const DialInput = forwardRef<HTMLInputElement, DialInputProps>(function DialInput(
	{ handleBackspaceClick, handleOnChange, isButtonDisabled, inputError, inputName },
	ref,
) {
	const { t } = useTranslation();

	return (
		<TextInput
			ref={ref}
			textAlign='center'
			placeholder={t('Phone_number')}
			addon={<IconButton icon='backspace' small size='20px' disabled={isButtonDisabled} onClick={handleBackspaceClick} />}
			error={inputError}
			onChange={handleOnChange}
			name={inputName}
		/>
	);
});

import { IconButton, TextInput } from '@rocket.chat/fuselage';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ChangeEvent, FocusEvent, forwardRef, ReactElement, Ref } from 'react';

type DialInputProps = {
	inputRef: Ref<HTMLInputElement>;
	inputName: string;
	inputError: string | undefined;
	isButtonDisabled: boolean;
	onBlur?: (event: FocusEvent<HTMLElement, Element>) => void;
	handleBackspaceClick: () => void;
	handleOnChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

export const DialInput = forwardRef(function DialInput(
	{ handleBackspaceClick, handleOnChange, inputRef, isButtonDisabled, inputError, inputName }: DialInputProps,
	ref,
): ReactElement {
	const t = useTranslation();
	const _ref = useMergedRefs(ref as Ref<unknown>, inputRef);

	return (
		<TextInput
			ref={_ref}
			textAlign='center'
			placeholder={t('Phone_number')}
			addon={<IconButton icon='backspace' small size='20px' disabled={isButtonDisabled} onClick={handleBackspaceClick} />}
			error={inputError}
			onChange={handleOnChange}
			name={inputName}
		/>
	);
});

import { Button, Icon, TextInput } from '@rocket.chat/fuselage';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ChangeEvent, FocusEvent, FormEvent, forwardRef, ReactElement, Ref } from 'react';

type DialInputProps = {
	onChange: (e: ChangeEvent<HTMLElement>) => void;
	onBlur?: (event: FocusEvent<HTMLElement, Element>) => void;
	handleInputChange: (event: FormEvent<HTMLInputElement>) => void;
	handleBackspaceClick: () => void;
	inputRef: Ref<HTMLInputElement>;
	isButtonDisabled: boolean;
	inputError: string | undefined;
	inputName: string;
};

export const DialInput = forwardRef(function DialInput(
	{ onChange, handleInputChange, handleBackspaceClick, inputRef, isButtonDisabled, inputError, inputName }: DialInputProps,
	ref,
): ReactElement {
	const t = useTranslation();
	const _ref = useMergedRefs(ref as Ref<unknown>, inputRef);

	return (
		<TextInput
			ref={_ref}
			textAlign='center'
			placeholder={t('Phone_number')}
			addon={
				<Button nude small square size='20px' disabled={isButtonDisabled} onClick={handleBackspaceClick}>
					<Icon name='backspace' size='20px' />
				</Button>
			}
			error={inputError}
			onChange={(e: unknown): void => {
				handleInputChange(e as FormEvent<HTMLInputElement>);
				onChange(e as ChangeEvent<HTMLElement>);
			}}
			name={inputName}
		/>
	);
});

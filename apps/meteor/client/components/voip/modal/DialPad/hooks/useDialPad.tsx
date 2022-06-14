import { useTranslation } from '@rocket.chat/ui-contexts';
import { FormEvent, RefCallback, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

type DialPadStateHandlers = {
	inputName: string;
	inputValue: string;
	inputRef: RefCallback<HTMLInputElement>;
	inputError: string | undefined;
	isButtonDisabled: boolean;
	handleInputChange: (event: FormEvent<HTMLInputElement>) => void;
	handleBackspaceClick: () => void;
	handlePadButtonClick: (digit: string | number) => void;
	handleCallButtonClick: () => void;
};

export const useDialPad = (): DialPadStateHandlers => {
	const t = useTranslation();

	const {
		setFocus,
		register,
		setValue,
		setError,
		clearErrors,
		watch,
		formState: { errors },
	} = useForm<{ PhoneInput: string }>();

	const { ref, onChange } = register('PhoneInput');
	const value = watch('PhoneInput');

	const [disabled, setDisabled] = useState(true);

	const handleBackspaceClick = useCallback((): void => {
		setValue('PhoneInput', value.slice(0, -1));
	}, [setValue, value]);

	const handlePadButtonClick = useCallback(
		(digit: string | number): void => {
			setValue('PhoneInput', value + digit);
		},
		[setValue, value],
	);

	const handleCallButtonClick = useCallback((): void => {
		setError('PhoneInput', { message: t('Something_went_wrong_try_again_later') });
	}, [setError, t]);

	const handleOnChange = useCallback(
		(e: FormEvent<HTMLInputElement>): void => {
			onChange(e);
		},
		[onChange],
	);

	useEffect(() => {
		setDisabled(!value);
		clearErrors('PhoneInput');
	}, [clearErrors, value]);

	useEffect(() => {
		setFocus('PhoneInput');
	}, [setFocus]);

	return {
		inputName: 'PhoneInput',
		inputValue: value,
		inputRef: ref,
		inputError: errors.PhoneInput?.message,
		isButtonDisabled: disabled,
		handleInputChange: handleOnChange,
		handleBackspaceClick,
		handlePadButtonClick,
		handleCallButtonClick,
	};
};

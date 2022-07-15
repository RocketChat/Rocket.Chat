import { useTranslation } from '@rocket.chat/ui-contexts';
import { ChangeEvent, RefCallback, useCallback, useEffect, useState } from 'react';
import { useForm, UseFormHandleSubmit } from 'react-hook-form';

import { useDialModal } from '../../../../../../client/hooks/useDialModal';
import { useOutboundDialer } from '../../../../hooks/useOutboundDialer';
import type { PadDigit } from '../Pad';

type DialPadStateHandlers = {
	inputName: string;
	inputRef: RefCallback<HTMLInputElement>;
	inputError: string | undefined;
	isButtonDisabled: boolean;
	handleOnChange: (e: ChangeEvent<HTMLInputElement>) => void;
	handleBackspaceClick: () => void;
	handlePadButtonClick: (digit: PadDigit) => void;
	handlePadButtonLongPressed: (digit: PadDigit) => void;
	handleCallButtonClick: () => void;
	handleSubmit: UseFormHandleSubmit<{
		PhoneInput: string;
	}>;
	onSubmit: () => void;
};

type DialPadProps = {
	initialValue?: string;
	errorMessage?: string;
};

export const useDialPad = ({ initialValue, errorMessage }: DialPadProps): DialPadStateHandlers => {
	const t = useTranslation();
	const outboundClient = useOutboundDialer();
	const { closeDialModal } = useDialModal();

	const {
		setFocus,
		register,
		setValue,
		setError,
		clearErrors,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<{ PhoneInput: string }>({
		defaultValues: {
			PhoneInput: initialValue,
		},
	});

	const { ref, onChange } = register('PhoneInput');

	const value = watch('PhoneInput');

	const [disabled, setDisabled] = useState(true);

	const handleBackspaceClick = useCallback((): void => {
		clearErrors();
		setValue('PhoneInput', value.slice(0, -1));
	}, [clearErrors, setValue, value]);

	const handlePadButtonClick = useCallback(
		(digit: PadDigit): void => {
			clearErrors();

			setValue('PhoneInput', value + digit[0]);
		},
		[clearErrors, setValue, value],
	);

	const handlePadButtonLongPressed = useCallback(
		(digit: PadDigit): void => {
			if (digit[0] === '0') {
				return setValue('PhoneInput', value + digit[1]);
			}

			setValue('PhoneInput', value + digit[0]);
		},
		[setValue, value],
	);

	const handleCallButtonClick = useCallback((): void => {
		if (!outboundClient) {
			return setError('PhoneInput', { message: t('Something_went_wrong_try_again_later') });
		}

		outboundClient.makeCall(value.replace('+', ''));
		closeDialModal();
	}, [outboundClient, setError, t, value, closeDialModal]);

	const onSubmit = useCallback(() => {
		handleCallButtonClick();
	}, [handleCallButtonClick]);

	const handleOnChange = useCallback(
		(e) => {
			clearErrors();
			onChange(e);
		},
		[clearErrors, onChange],
	);

	useEffect(() => {
		setError('PhoneInput', { message: errorMessage });
	}, [setError, errorMessage]);

	useEffect(() => {
		setDisabled(!value);
	}, [value]);

	useEffect(() => {
		setFocus('PhoneInput');
	}, [value, setFocus]);

	return {
		inputName: 'PhoneInput',
		inputRef: ref,
		inputError: errors.PhoneInput?.message,
		isButtonDisabled: disabled,
		handleOnChange,
		handleBackspaceClick,
		handlePadButtonClick,
		handlePadButtonLongPressed,
		handleCallButtonClick,
		handleSubmit,
		onSubmit,
	};
};

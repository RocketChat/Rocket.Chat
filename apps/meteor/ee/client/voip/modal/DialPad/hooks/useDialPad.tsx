import { useTranslation } from '@rocket.chat/ui-contexts';
import { ChangeEvent, RefCallback, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useDialModal } from '../../../../../../client/hooks/useDialModal';
import { useOutboundDialer } from '../../../../hooks/useOutboundDialer';

type DialPadStateHandlers = {
	inputName: string;
	inputRef: RefCallback<HTMLInputElement>;
	inputError: string | undefined;
	isButtonDisabled: boolean;
	handleOnChange: (e: ChangeEvent<HTMLInputElement>) => void;
	handleBackspaceClick: () => void;
	handlePadButtonClick: (digit: string | number) => void;
	handleCallButtonClick: () => void;
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
		setValue('PhoneInput', value.slice(0, -1));
	}, [setValue, value]);

	const handlePadButtonClick = useCallback(
		(digit: string | number): void => {
			setValue('PhoneInput', value + digit);
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

	useEffect(() => {
		setError('PhoneInput', { message: errorMessage });
	}, [setError, errorMessage]);

	useEffect(() => {
		setDisabled(!value);
	}, [clearErrors, value]);

	useEffect(() => {
		setFocus('PhoneInput');
	}, [setFocus]);

	return {
		inputName: 'PhoneInput',
		inputRef: ref,
		inputError: errors.PhoneInput?.message,
		isButtonDisabled: disabled,
		handleOnChange: onChange,
		handleBackspaceClick,
		handlePadButtonClick,
		handleCallButtonClick,
	};
};

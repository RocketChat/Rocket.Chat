import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, RefCallback } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useDialModal } from '../../../../../../client/hooks/useDialModal';
import { useOmnichannelOutboundDialer as useOutboundDialer } from '../../../../hooks/useOmnichannelOutboundDialer';
import type { PadDigit } from '../Pad';

type DialPadStateHandlers = {
	inputName: string;
	inputRef: RefCallback<HTMLInputElement>;
	inputError: string | undefined;
	isButtonDisabled: boolean;
	handleOnChange: (e: ChangeEvent<HTMLInputElement>) => void;
	handleBackspaceClick: () => void;
	handlePadButtonClick: (digit: PadDigit[0]) => void;
	handlePadButtonLongPressed: (digit: PadDigit[1]) => void;
	handleCallButtonClick: () => void;
};

type DialPadProps = {
	initialValue?: string;
	initialErrorMessage?: string;
};

export const useDialPad = ({ initialValue, initialErrorMessage }: DialPadProps): DialPadStateHandlers => {
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
		formState: { errors, isDirty },
	} = useForm<{ PhoneInput: string }>({
		defaultValues: {
			PhoneInput: initialValue || '',
		},
	});

	const { ref, onChange } = register('PhoneInput');

	const value = watch('PhoneInput');

	const [disabled, setDisabled] = useState(true);

	const handleBackspaceClick = useCallback((): void => {
		clearErrors();
		setValue('PhoneInput', value.slice(0, -1), { shouldDirty: true });
	}, [clearErrors, setValue, value]);

	const handlePadButtonClick = useCallback(
		(digit: PadDigit[0]): void => {
			clearErrors();

			setValue('PhoneInput', value + digit, { shouldDirty: true });
		},
		[clearErrors, setValue, value],
	);

	const handlePadButtonLongPressed = useCallback(
		(digit: PadDigit[1]): void => {
			if (digit !== '+') {
				return;
			}

			setValue('PhoneInput', value + digit);
		},
		[setValue, value],
	);

	const handleCallButtonClick = useCallback((): void => {
		if (!outboundClient) {
			return setError('PhoneInput', { message: t('Something_went_wrong_try_again_later') });
		}

		outboundClient.makeCall(value);
		closeDialModal();
	}, [outboundClient, setError, t, value, closeDialModal]);

	const handleOnChange = useCallback((e) => onChange(e), [onChange]);

	useEffect(() => {
		setDisabled(!value);
	}, [value]);

	useEffect(() => {
		setFocus('PhoneInput');
	}, [setFocus]);

	return {
		inputName: 'PhoneInput',
		inputRef: ref,
		inputError: isDirty ? errors.PhoneInput?.message : initialErrorMessage,
		isButtonDisabled: disabled,
		handleOnChange,
		handleBackspaceClick,
		handlePadButtonClick,
		handlePadButtonLongPressed,
		handleCallButtonClick,
	};
};

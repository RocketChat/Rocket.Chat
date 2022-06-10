import { Box, Button, Icon, Field, Modal, TextInput } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FormEvent, ReactElement, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import InputMask from 'react-input-mask';

import Pad from './Pad';

const DialPadModal = (): ReactElement => {
	const t = useTranslation();

	const {
		setFocus,
		register,
		setValue,
		getValues,
		setError,
		clearErrors,
		formState: {
			errors: { PhoneInput: error },
		},
	} = useForm<{ PhoneInput: string }>();
	const { name, ref, onChange } = register('PhoneInput');

	const [disabled, setDisabled] = useState(true);

	const handleChange = useCallback((): void => {
		const value = getValues('PhoneInput');
		setDisabled(!value);
		clearErrors('PhoneInput');
	}, [clearErrors, getValues]);

	const handleBackspaceClick = useCallback((): void => {
		const value = getValues('PhoneInput').slice(0, -1);
		setValue('PhoneInput', value);
		handleChange();
	}, [getValues, handleChange, setValue]);

	const handleInputChange = useCallback(
		(e: FormEvent): void => {
			onChange(e);
			handleChange();
		},
		[handleChange, onChange],
	);

	const onClickPadButton = useCallback(
		(digit: string | number): void => {
			const value = getValues('PhoneInput') + digit;
			setValue('PhoneInput', value);
			handleChange();
		},
		[getValues, handleChange, setValue],
	);

	const onClickCallButton = useCallback((): void => {
		setError('PhoneInput', { message: t('Something_went_wrong_try_again_later') });
	}, [setError, t]);

	useEffect(() => {
		setFocus('PhoneInput');
	}, [setFocus]);

	return (
		<Modal w='400px'>
			<Modal.Header>
				<Modal.Title />
				<Modal.Close />
			</Modal.Header>
			<Modal.Content display='flex' justifyContent='center' flexDirection='column'>
				<Field>
					<InputMask
						value={getValues('PhoneInput')}
						name={name}
						mask='(99) 99999-9999'
						onChange={handleInputChange}
						maskChar=''
						alwaysShowMask={false}
					>
						{({ onChange, name }: any): ReactElement => (
							<TextInput
								ref={ref}
								textAlign='center'
								placeholder={t('Phone_number')}
								addon={
									<Button nude small square size='20px' disabled={disabled} onClick={handleBackspaceClick}>
										<Icon name='backspace' size='20px' />
									</Button>
								}
								error={error?.message}
								onChange={onChange}
								name={name}
							/>
						)}
					</InputMask>
					<Field.Error h='20px' textAlign='center'>
						{error?.message}
					</Field.Error>
				</Field>
				<Pad onClickPadButton={onClickPadButton} />
			</Modal.Content>
			<Modal.Footer>
				<Box display='flex' justifyContent='center'>
					<Button disabled={disabled} borderRadius='full' primary size='64px' onClick={onClickCallButton}>
						<Icon color='white' name='phone' size='32px' />
					</Button>
				</Box>
			</Modal.Footer>
		</Modal>
	);
};

export default DialPadModal;

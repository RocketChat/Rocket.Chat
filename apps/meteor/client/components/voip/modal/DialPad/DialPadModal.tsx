import { Box, Button, Icon, Field, Modal, TextInput } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';
import InputMask from 'react-input-mask';

import Pad from './Pad';
import { useDialPad } from './hooks/useDialPad';

const DialPadModal = (): ReactElement => {
	const t = useTranslation();

	const {
		inputName,
		inputValue,
		inputRef,
		inputError,
		isButtonDisabled,
		handleInputChange,
		handleBackspaceClick,
		handlePadButtonClick,
		handleCallButtonClick,
	} = useDialPad();

	return (
		<Modal w='400px'>
			<Modal.Header>
				<Modal.Title />
				<Modal.Close />
			</Modal.Header>
			<Modal.Content display='flex' justifyContent='center' flexDirection='column'>
				<Field>
					<InputMask
						value={inputValue}
						name={inputName}
						mask='+99 (99) 99999-9999'
						onChange={handleInputChange}
						maskChar=''
						alwaysShowMask={false}
					>
						{({ onChange, name }: any): ReactElement => (
							<TextInput
								ref={inputRef}
								textAlign='center'
								placeholder={t('Phone_number')}
								addon={
									<Button nude small square size='20px' disabled={isButtonDisabled} onClick={handleBackspaceClick}>
										<Icon name='backspace' size='20px' />
									</Button>
								}
								error={inputError}
								onChange={onChange}
								name={name}
							/>
						)}
					</InputMask>
					<Field.Error h='20px' textAlign='center'>
						{inputError}
					</Field.Error>
				</Field>
				<Pad onClickPadButton={handlePadButtonClick} />
			</Modal.Content>
			<Modal.Footer>
				<Box display='flex' justifyContent='center'>
					<Button disabled={isButtonDisabled} borderRadius='full' primary size='64px' onClick={handleCallButtonClick}>
						<Icon color='white' name='phone' size='32px' />
					</Button>
				</Box>
			</Modal.Footer>
		</Modal>
	);
};

export default DialPadModal;

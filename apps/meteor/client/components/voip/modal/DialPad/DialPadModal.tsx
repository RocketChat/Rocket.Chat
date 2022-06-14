import { Box, Button, Icon, Field, Modal } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';
import MaskedInput from 'react-text-mask';

import { DialInput } from './DialInput';
import Pad from './Pad';
import { useDialPad } from './hooks/useDialPad';

const DialPadModal = ({ handleClose }: { handleClose: () => void }): ReactElement => {
	const {
		inputName,
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
				<Modal.Close onClick={handleClose} />
			</Modal.Header>
			<Modal.Content display='flex' justifyContent='center' flexDirection='column'>
				<Field>
					<MaskedInput
						mask={['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]}
						guide={false}
						render={(ref, props): ReactElement => (
							<DialInput
								ref={ref}
								inputName={inputName}
								inputRef={inputRef}
								inputError={inputError}
								handleInputChange={handleInputChange}
								handleBackspaceClick={handleBackspaceClick}
								isButtonDisabled={isButtonDisabled}
								{...props}
							/>
						)}
					/>
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

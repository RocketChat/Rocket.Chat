import { Field, Modal, IconButton } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { DialInput } from './DialInput';
import Pad from './Pad';
import { useDialPad } from './hooks/useDialPad';
import { useEnterKey } from './hooks/useEnterKey';

type DialPadModalProps = {
	initialValue?: string;
	errorMessage?: string;
	handleClose: () => void;
};

const DialPadModal = ({ initialValue, errorMessage, handleClose }: DialPadModalProps): ReactElement => {
	const {
		inputName,
		inputRef,
		inputError,
		isButtonDisabled,
		handleOnChange,
		handleBackspaceClick,
		handlePadButtonClick,
		handlePadButtonLongPressed,
		handleCallButtonClick,
	} = useDialPad({ initialValue, errorMessage });

	useEnterKey(handleCallButtonClick, isButtonDisabled);

	return (
		<Modal maxWidth='400px'>
			<Modal.Header>
				<Modal.Title />
				<Modal.Close onClick={handleClose} />
			</Modal.Header>
			<Modal.Content display='flex' justifyContent='center' flexDirection='column'>
				<Field>
					<DialInput
						ref={inputRef}
						inputName={inputName}
						inputError={inputError}
						handleBackspaceClick={handleBackspaceClick}
						isButtonDisabled={isButtonDisabled}
						handleOnChange={handleOnChange}
					/>
					<Field.Error h='20px' textAlign='center'>
						{inputError}
					</Field.Error>
				</Field>
				<Pad onClickPadButton={handlePadButtonClick} onLongPressPadButton={handlePadButtonLongPressed} />
			</Modal.Content>
			<Modal.Footer justifyContent='center'>
				<IconButton
					icon='phone'
					disabled={isButtonDisabled}
					borderRadius='full'
					secondary
					info
					size='64px'
					onClick={(): void => {
						handleCallButtonClick();
						handleClose();
					}}
				/>
			</Modal.Footer>
		</Modal>
	);
};

export default DialPadModal;

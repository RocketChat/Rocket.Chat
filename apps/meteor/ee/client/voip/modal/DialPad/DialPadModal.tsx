import { Box, Field, Modal, IconButton } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { DialInput } from './DialInput';
import Pad from './Pad';
import { useDialPad } from './hooks/useDialPad';

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
		handleSubmit,
		onSubmit,
	} = useDialPad({ initialValue, errorMessage });

	return (
		<Modal maxWidth='400px'>
			<Modal.Header>
				<Modal.Title />
				<Modal.Close onClick={handleClose} />
			</Modal.Header>
			<Modal.Content is='form' onSubmit={handleSubmit(onSubmit)} display='flex' justifyContent='center' flexDirection='column'>
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
			<Modal.Footer>
				<Box display='flex' justifyContent='center'>
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
				</Box>
			</Modal.Footer>
		</Modal>
	);
};

export default DialPadModal;

import { Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement, ComponentProps } from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';

// TO-DO: Replace by GenericModal

type WarningModalProps = ComponentProps<typeof Modal> & {
	text: string;
	confirmText: string;
	close: () => void;
	confirm: () => void;
};

const WarningModal = ({ text, confirmText, close, confirm, ...props }: WarningModalProps): ReactElement => {
	const refAutoFocus = useAutoFocus(true);
	const t = useTranslation();

	return (
		<Modal {...props}>
			<Modal.Header>
				<Icon color='warning' name='modal-warning' size={20} />
				<Modal.Title>{t('Are_you_sure')}</Modal.Title>
				<Modal.Close onClick={close} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>{text}</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button ghost onClick={close}>
						{t('Cancel')}
					</Button>
					<Button ref={refAutoFocus} primary danger onClick={confirm}>
						{confirmText}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default WarningModal;

import { Accordion, AccordionItem, Box, Button } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import GenericModal from '../../../../components/GenericModal';

type DisableE2EEModalProps = {
	onConfirm: () => void;
	onCancel: () => void;
	roomType: string;
	canResetRoomKey: boolean;
	onResetRoomKey: () => void;
};

const DisableE2EEModal = ({ onConfirm, onCancel, roomType, canResetRoomKey, onResetRoomKey }: DisableE2EEModalProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<GenericModal
			icon='key'
			title={t('E2E_disable_encryption')}
			variant='warning'
			confirmText={t('E2E_disable_encryption')}
			onConfirm={onConfirm}
			onCancel={onCancel}
			onDismiss={() => undefined}
		>
			<Box mbe={16} is='p'>
				<Trans i18nKey='E2E_disable_encryption_description' tOptions={{ roomType }} />
			</Box>

			{canResetRoomKey && (
				<>
					<Box mbe={16} is='p'>
						{t('E2E_disable_encryption_reset_keys_description')}
					</Box>
					<Accordion>
						<AccordionItem title={t('E2E_reset_encryption_keys')}>
							<Box mbe={16} is='p'>
								{t('E2E_reset_encryption_keys_description')}
							</Box>
							<Button secondary danger small onClick={onResetRoomKey}>
								{t('E2E_reset_encryption_keys_button', { roomType })}
							</Button>
						</AccordionItem>
					</Accordion>
				</>
			)}
		</GenericModal>
	);
};

export default DisableE2EEModal;

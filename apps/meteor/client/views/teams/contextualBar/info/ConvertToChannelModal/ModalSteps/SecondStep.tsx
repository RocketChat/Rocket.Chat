import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import AbacAttributesRemovalWarning from '../../../../../../components/ABAC/AbacAttributesRemovalWarning';

type SecondStepsProps = {
	onClose: () => void;
	onCancel: () => void;
	onConfirm: (deletedRooms: { [key: string]: Serialized<IRoom> }) => void;
	deletedRooms: {
		[key: string]: Serialized<IRoom>;
	};
	rooms?: (Serialized<IRoom> & { isLastOwner?: boolean })[];
	removesAbacAttributes?: boolean;
};

const SecondStep = ({ onClose, onCancel, onConfirm, deletedRooms = {}, rooms = [], removesAbacAttributes, ...props }: SecondStepsProps) => {
	const { t } = useTranslation();

	return (
		<GenericModal
			{...props}
			variant='warning'
			icon={<Icon name='modal-warning' size='x24' color='status-font-on-warning' />}
			cancelText={rooms?.length > 0 ? t('Back') : t('Cancel')}
			confirmText={t('Convert')}
			title={t('Confirmation')}
			onClose={onClose}
			onCancel={onCancel}
			onConfirm={(): void => onConfirm(deletedRooms)}
		>
			{t('You_are_converting_team_to_channel')}
			{removesAbacAttributes && <AbacAttributesRemovalWarning />}
		</GenericModal>
	);
};

export default SecondStep;

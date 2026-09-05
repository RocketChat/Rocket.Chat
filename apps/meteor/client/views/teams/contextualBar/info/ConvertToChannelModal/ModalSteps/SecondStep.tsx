import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import AbacAttributesLostWarning from '../../../../../../components/ABAC/AbacAttributesLostWarning';

type SecondStepsProps = {
	onClose: () => void;
	onCancel: () => void;
	onConfirm: (deletedRooms: { [key: string]: Serialized<IRoom> }) => void;
	deletedRooms: {
		[key: string]: Serialized<IRoom>;
	};
	rooms?: (Serialized<IRoom> & { isLastOwner?: boolean })[];
	/** The team's main room — converting it to a channel discards its ABAC attributes. */
	teamRoom?: Pick<IRoom, 'abacAttributes'>;
};

const SecondStep = ({ onClose, onCancel, onConfirm, deletedRooms = {}, rooms = [], teamRoom, ...props }: SecondStepsProps) => {
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
			{teamRoom && <AbacAttributesLostWarning room={teamRoom} />}
		</GenericModal>
	);
};

export default SecondStep;

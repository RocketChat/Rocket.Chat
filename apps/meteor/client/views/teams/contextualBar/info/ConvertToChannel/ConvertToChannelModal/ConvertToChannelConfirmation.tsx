import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../../../components/GenericModal';

type ConvertToChannelConfirmationProps = {
	onClose: () => void;
	onCancel: () => void;
	onConfirm: (roomsToRemove: { [key: string]: Serialized<IRoom> }) => Promise<void>;
	roomsToRemove: {
		[key: string]: Serialized<IRoom>;
	};
	rooms?: (Serialized<IRoom> & { isLastOwner?: boolean })[];
};

const ConvertToChannelConfirmation = ({
	onClose,
	onCancel,
	onConfirm,
	roomsToRemove,
	rooms = [],
	...props
}: ConvertToChannelConfirmationProps) => {
	const t = useTranslation();

	return (
		<GenericModal
			variant='warning'
			icon={<Icon name='modal-warning' size='x24' color='status-font-on-warning' />}
			cancelText={rooms?.length > 0 ? t('Back') : t('Cancel')}
			confirmText={t('Convert')}
			title={t('Confirmation')}
			onClose={onClose}
			onCancel={onCancel}
			onConfirm={() => onConfirm(roomsToRemove)}
			{...props}
		>
			{t('You_are_converting_team_to_channel')}
		</GenericModal>
	);
};

export default ConvertToChannelConfirmation;

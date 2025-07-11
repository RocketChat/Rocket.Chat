import { Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import type { ComponentPropsWithoutRef } from 'react';
import { Trans } from 'react-i18next';

type ConfirmOwnerChangeModalProps = {
	shouldChangeOwner: string[];
	shouldBeRemoved: string[];
	contentTitle?: string;
} & Pick<ComponentPropsWithoutRef<typeof GenericModal>, 'onConfirm' | 'onCancel' | 'confirmText'>;

const ConfirmOwnerChangeModal = ({
	shouldChangeOwner,
	shouldBeRemoved,
	contentTitle,
	confirmText,
	onConfirm,
	onCancel,
}: ConfirmOwnerChangeModalProps) => {
	const getChangeOwnerRooms = useEffectEvent(() => {
		if (shouldChangeOwner.length === 0) {
			return '';
		}

		if (shouldChangeOwner.length === 1) {
			return (
				<Trans
					i18nKey='A_new_owner_will_be_assigned_automatically_to_the__roomName__room'
					values={{ roomName: shouldChangeOwner[0] }}
					components={{ bold: <Box is='span' fontWeight='bold' /> }}
				/>
			);
		}
		if (shouldChangeOwner.length <= 5) {
			return (
				<Trans
					i18nKey='A_new_owner_will_be_assigned_automatically_to_those__count__rooms__rooms__'
					values={{ count: shouldChangeOwner.length, rooms: shouldChangeOwner.join(', ') }}
					components={{ br: <br />, bold: <Box is='span' fontWeight='bold' /> }}
				/>
			);
		}
		return (
			<Trans
				i18nKey='A_new_owner_will_be_assigned_automatically_to__count__rooms'
				values={{ count: shouldChangeOwner.length }}
				components={{ bold: <Box is='span' fontWeight='bold' /> }}
			/>
		);
	});

	const getRemovedRooms = useEffectEvent(() => {
		if (shouldBeRemoved.length === 0) {
			return '';
		}

		if (shouldBeRemoved.length === 1) {
			return (
				<Trans
					i18nKey='The_empty_room__roomName__will_be_removed_automatically'
					values={{ roomName: shouldBeRemoved[0] }}
					components={{ bold: <Box is='span' fontWeight='bold' /> }}
				/>
			);
		}
		if (shouldBeRemoved.length <= 5) {
			return (
				<Trans
					i18nKey='__count__empty_rooms_will_be_removed_automatically__rooms__'
					values={{ count: shouldBeRemoved.length, rooms: shouldBeRemoved.join(', ') }}
					components={{ br: <br />, bold: <Box is='span' fontWeight='bold' /> }}
				/>
			);
		}
		return <Trans i18nKey='__count__empty_rooms_will_be_removed_automatically' values={{ count: shouldBeRemoved.length }} />;
	});

	return (
		<GenericModal variant='danger' onClose={onCancel} onCancel={onCancel} confirmText={confirmText} onConfirm={onConfirm}>
			{contentTitle}

			{shouldChangeOwner && <Box marginBlock={16}>{getChangeOwnerRooms()}</Box>}
			{shouldBeRemoved && <Box marginBlock={16}>{getRemovedRooms()}</Box>}
		</GenericModal>
	);
};

export default ConfirmOwnerChangeModal;

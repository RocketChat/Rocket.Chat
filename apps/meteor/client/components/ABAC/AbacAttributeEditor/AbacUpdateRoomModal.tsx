import type { AbacMembershipPreview } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { Trans, useTranslation } from 'react-i18next';

export type AbacUpdateRoomModalProps = {
	roomName?: string;
	preview: AbacMembershipPreview;
	isSaving?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
};

/**
 * Confirmation before an attribute change is committed (ABAC-P4 M3).
 *
 * Three states, per Figma `3779:47398`, `3757:26922` and `3505:6458`:
 *  - nobody removed — a plain confirmation;
 *  - some removed — "Update ABAC room", stating the exact impact;
 *  - everybody removed — "Empty ABAC room", presented as destructive, because re-populating an
 *    empty ABAC room is expensive to undo.
 *
 * Nothing is committed until `onConfirm`. The editor losing their own access is called out here as
 * well as in the preview, because this is the last point at which they can back out (D2).
 */
const AbacUpdateRoomModal = ({ roomName, preview, isSaving = false, onConfirm, onCancel }: AbacUpdateRoomModalProps) => {
	const { t } = useTranslation();

	const { counts, actorLosesAccess } = preview;
	const willEmptyRoom = counts.losing > 0 && counts.losing === counts.total;

	const selfLockoutWarning = actorLosesAccess && (
		<Box marginBlockStart={8} color='danger'>
			{t('ABAC_You_will_lose_access')}
		</Box>
	);

	if (willEmptyRoom) {
		return (
			<GenericModal
				variant='danger'
				title={t('ABAC_Empty_room_confirmation_modal_title')}
				annotation={t('ABAC_Update_room_confirmation_modal_annotation')}
				confirmText={t('Save_changes')}
				cancelText={t('ABAC_Back_to_editing')}
				confirmLoading={isSaving}
				onConfirm={onConfirm}
				onCancel={onCancel}
			>
				<Box>{t('ABAC_All_members_will_be_removed')}</Box>
				<Box marginBlockStart={8}>{t('ABAC_Empty_room_repopulation_warning')}</Box>
				{selfLockoutWarning}
			</GenericModal>
		);
	}

	if (counts.losing > 0) {
		return (
			<GenericModal
				variant='warning'
				title={t('ABAC_Update_room_confirmation_modal_title')}
				confirmText={t('Save_changes')}
				cancelText={t('ABAC_Back_to_editing')}
				confirmLoading={isSaving}
				onConfirm={onConfirm}
				onCancel={onCancel}
			>
				<Box>
					<Trans
						i18nKey='ABAC_N_of_M_members_will_be_removed_from_room'
						values={{ count: counts.losing, total: counts.total, roomName }}
						components={{ bold: <Box is='span' fontWeight='bold' /> }}
					/>
				</Box>
				{selfLockoutWarning}
			</GenericModal>
		);
	}

	return (
		<GenericModal
			variant='info'
			icon={null}
			title={t('ABAC_Update_room_confirmation_modal_title')}
			confirmText={t('Save_changes')}
			cancelText={t('ABAC_Back_to_editing')}
			confirmLoading={isSaving}
			onConfirm={onConfirm}
			onCancel={onCancel}
		>
			<Box>{t('ABAC_No_members_will_be_removed')}</Box>
			{selfLockoutWarning}
		</GenericModal>
	);
};

export default AbacUpdateRoomModal;

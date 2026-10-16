import type { ISubscriptionLabel } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useDeleteLabel } from '../hooks/useLabelMutations';
import { useSidebarFilters } from '../hooks/useSidebarFiltersPreferences';

type DeleteLabelModalProps = {
	label: ISubscriptionLabel;
	onClose: () => void;
};

const DeleteLabelModal = ({ label, onClose }: DeleteLabelModalProps) => {
	const { t } = useTranslation();
	const filters = useSidebarFilters();
	const deleteLabel = useDeleteLabel();

	const affectedFilterNames = useMemo(
		() =>
			filters
				.filter(({ matches, notMatches }) =>
					[...matches.labels, ...notMatches.labels].some((ref) => ref.type === 'user' && ref._id === label._id),
				)
				.map(({ name }) => name),
		[filters, label._id],
	);

	const handleConfirm = async () => {
		await deleteLabel.mutateAsync({ labelId: label._id });
		onClose();
	};

	return (
		<GenericModal
			variant='danger'
			title={t('Delete_label')}
			confirmText={t('Delete')}
			confirmLoading={deleteLabel.isPending}
			onConfirm={handleConfirm}
			onCancel={onClose}
		>
			<Box marginBlockEnd={affectedFilterNames.length ? 16 : 0}>{t('Delete_label_description', { name: label.name })}</Box>
			{affectedFilterNames.length > 0 && (
				<Box>{t('Delete_label_affected_filters', { count: affectedFilterNames.length, filters: affectedFilterNames.join(', ') })}</Box>
			)}
		</GenericModal>
	);
};

export default DeleteLabelModal;

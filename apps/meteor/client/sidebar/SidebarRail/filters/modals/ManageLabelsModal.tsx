import type { ISubscriptionLabel } from '@rocket.chat/core-typings';
import { Box, IconButton } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import LabelIcon from '../components/LabelIcon';
import { useSubscriptionLabels } from '../hooks/useSidebarFiltersPreferences';

type ManageLabelsModalProps = {
	onCreate: () => void;
	onEdit: (label: ISubscriptionLabel) => void;
	onDelete: (label: ISubscriptionLabel) => void;
	onClose: () => void;
};

const ManageLabelsModal = ({ onCreate, onEdit, onDelete, onClose }: ManageLabelsModalProps) => {
	const { t } = useTranslation();
	const labels = useSubscriptionLabels();

	return (
		<GenericModal
			title={t('Manage_labels')}
			variant='warning'
			icon={null}
			confirmText={t('New_label')}
			cancelText={t('Close')}
			onConfirm={onCreate}
			onCancel={onClose}
			onDismiss={() => undefined}
		>
			{labels.length === 0 && <Box color='font-secondary-info'>{t('Labels_empty_description')}</Box>}
			{labels.length > 0 && (
				<Box is='ul' display='flex' flexDirection='column' gap={4} aria-label={t('Labels')}>
					{labels.map((label) => (
						<Box is='li' key={label._id} display='flex' alignItems='center' gap={8} paddingBlock={4}>
							<LabelIcon icon={label.icon} color={label.color} size='x20' />
							<Box flexGrow={1} withTruncatedText fontScale='p2'>
								{label.name}
							</Box>
							<IconButton small icon='edit' title={t('Edit')} aria-label={t('Edit')} onClick={() => onEdit(label)} />
							<IconButton small icon='trash' title={t('Delete')} aria-label={t('Delete')} onClick={() => onDelete(label)} />
						</Box>
					))}
				</Box>
			)}
		</GenericModal>
	);
};

export default ManageLabelsModal;

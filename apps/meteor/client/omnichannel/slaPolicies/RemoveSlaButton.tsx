import { IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useEndpoint, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../components/GenericModal';
import { GenericTableCell } from '../../components/GenericTable';

const RemoveSlaButton = ({ _id, reload }: { _id: string; reload: () => void }) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const slaRoute = useRoute('omnichannel-sla-policies');
	const dispatchToastMessage = useToastMessageDispatch();

	const removeSLA = useEndpoint('DELETE', `/v1/livechat/sla/:slaId`, { slaId: _id });

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async (): Promise<void> => {
			try {
				await removeSLA();
				dispatchToastMessage({ type: 'success', message: t('SLA_removed') });
				reload();
				slaRoute.push({});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal();
			}
		};

		setModal(<GenericModal variant='danger' onConfirm={onDeleteAgent} onCancel={(): void => setModal()} confirmText={t('Delete')} />);
	});

	return (
		<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
			<IconButton icon='trash' small title={t('Remove')} onClick={handleDelete} />
		</GenericTableCell>
	);
};

export default RemoveSlaButton;

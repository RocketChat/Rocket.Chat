import { Table, IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRoute, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import GenericModal from '../../../../client/components/GenericModal';

type Props = {
	_id: string;
	reload: () => void;
};

function RemoveSlaButton({ _id, reload }: Props): ReactElement {
	const removeSLA = useEndpoint('DELETE', `/v1/livechat/sla/${_id}`);
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();
	const slaRoute = useRoute('omnichannel-sla-policies');

	const handleRemoveClick = useMutableCallback(async () => {
		await removeSLA();
		reload();
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async (): Promise<void> => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Priority_removed') });
				slaRoute.push({});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(<GenericModal variant='danger' onConfirm={onDeleteAgent} onCancel={(): void => setModal()} confirmText={t('Delete')} />);
	});

	return (
		<Table.Cell fontScale='p2' color='hint' withTruncatedText>
			<IconButton icon='trash' mini title={t('Remove')} onClick={handleDelete} />
		</Table.Cell>
	);
}

export default RemoveSlaButton;

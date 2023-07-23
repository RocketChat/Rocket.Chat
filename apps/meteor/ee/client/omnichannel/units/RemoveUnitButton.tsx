import type { ILivechatUnitMonitor } from '@rocket.chat/core-typings';
import { IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRoute, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../client/components/GenericModal';
import { GenericTableCell } from '../../../../client/components/GenericTable';

const RemoveUnitButton = ({ _id, reload }: { _id: ILivechatUnitMonitor['unitId']; reload: () => void }) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const removeUnit = useMethod('livechat:removeUnit');
	const unitsRoute = useRoute('omnichannel-units');

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			try {
				await removeUnit(_id);
				dispatchToastMessage({ type: 'success', message: t('Unit_removed') });
				unitsRoute.push({});
				reload();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal();
			}
		};

		setModal(<GenericModal variant='danger' onConfirm={onDeleteAgent} onCancel={() => setModal()} confirmText={t('Delete')} />);
	});

	return (
		<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
			<IconButton icon='trash' small title={t('Remove')} onClick={handleDelete} />
		</GenericTableCell>
	);
};

export default RemoveUnitButton;

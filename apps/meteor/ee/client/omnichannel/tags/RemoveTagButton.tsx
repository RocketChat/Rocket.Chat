import type { ILivechatTag } from '@rocket.chat/core-typings';
import { IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRoute, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../client/components/GenericModal';
import { GenericTableCell } from '../../../../client/components/GenericTable';

const RemoveTagButton = ({ _id, reload }: { _id: ILivechatTag['_id']; reload: () => void }) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const tagsRoute = useRoute('omnichannel-tags');
	const removeTag = useMethod('livechat:removeTag');

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			try {
				await removeTag(_id);
				dispatchToastMessage({ type: 'success', message: t('Tag_removed') });
				tagsRoute.push({});
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

export default RemoveTagButton;

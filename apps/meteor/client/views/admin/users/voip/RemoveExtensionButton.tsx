import { Box, IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';
import { GenericTableCell } from '../../../../components/GenericTable';

const RemoveExtensionButton: FC<{ username: string; extension: string }> = ({ username, extension }) => {
	const removeExtension = useEndpoint('POST', '/v1/voip-freeswitch.extension.assign');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleRemoveClick = useMutableCallback(async () => {
		try {
			await removeExtension({ username });
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteExtension = async (): Promise<void> => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Extension_removed') });
			} catch (error: unknown) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(
			<GenericModal
				variant='danger'
				onConfirm={onDeleteExtension}
				onCancel={(): void => setModal()}
				onClose={(): void => setModal()}
				confirmText={t('Delete')}
			/>,
		);
	});

	return (
		<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
			<Box display='flex' alignItems='center'>
				<IconButton icon='trash' small title={t('Remove_Association')} onClick={handleDelete} /> {extension}
			</Box>
		</GenericTableCell>
	);
};

export default RemoveExtensionButton;

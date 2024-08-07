import { Box, IconButton } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useEndpoint, useUser } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../../components/GenericModal';
import { GenericTableCell } from '../../../../components/GenericTable';

const RemoveExtensionButton = ({ username, extension }: { username: string; extension: string }) => {
	const removeExtension = useEndpoint('POST', '/v1/voip-freeswitch.extension.assign');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const loggedUser = useUser();

	const handleRemove = useMutation({
		mutationFn: ({ username }: { username: string }) => removeExtension({ username }),
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Extension_removed') });

			queryClient.invalidateQueries(['users.list']);
			if (loggedUser?.username === username) {
				queryClient.invalidateQueries(['voice-call-client']);
			}

			setModal(null);
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
			setModal(null);
		},
	});

	const handleDelete = useEffectEvent((e) => {
		e.stopPropagation();

		setModal(
			<GenericModal
				variant='danger'
				onConfirm={() => handleRemove.mutate({ username })}
				onCancel={(): void => setModal()}
				onClose={(): void => setModal()}
				confirmText={t('Delete')}
			/>,
		);
	});

	return (
		<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
			<Box display='flex' alignItems='center'>
				<IconButton disabled={handleRemove.isLoading} icon='trash' small title={t('Remove_Association')} onClick={handleDelete} />{' '}
				{extension}
			</Box>
		</GenericTableCell>
	);
};

export default RemoveExtensionButton;

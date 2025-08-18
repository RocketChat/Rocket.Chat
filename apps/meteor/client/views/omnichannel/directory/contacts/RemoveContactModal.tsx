import { Box, Input } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReactElement, ChangeEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type RemoveContactModalProps = {
	_id: string;
	name: string;
	channelsCount: number;
	onClose: () => void;
};

const RemoveContactModal = ({ _id, name, channelsCount, onClose }: RemoveContactModalProps): ReactElement => {
	const { t } = useTranslation();
	const [text, setText] = useState<string>('');

	const queryClient = useQueryClient();
	const removeContact = useEndpoint('POST', '/v1/omnichannel/contacts.delete');
	const dispatchToast = useToastMessageDispatch();

	const removeContactMutation = useMutation({
		mutationFn: () => removeContact({ contactId: _id }),
		onSuccess: async () => {
			dispatchToast({ type: 'success', message: 'Contact successfully removed!' });
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ['current-contacts'],
				}),
				queryClient.invalidateQueries({
					queryKey: ['getContactsByIds', _id],
				}),
			]);
			onClose();
		},
		onError: (error) => {
			dispatchToast({ type: 'error', message: error.message });
		},
	});

	return (
		<GenericModal
			wrapperFunction={(props) => <Box is='form' onSubmit={() => removeContactMutation.mutate()} {...props} />}
			onCancel={onClose}
			confirmText={t('Delete')}
			title='Delete Contact'
			onClose={onClose}
			variant='danger'
			data-qa-id='delete-contact-modal'
			confirmDisabled={text !== 'delete'}
		>
			<Box mbe={16}>{t('Are_you_sure_delete_contact', { contactName: name, channelsCount })}</Box>
			<Box mbe={16} display='flex' justifyContent='stretch'>
				<Input
					value={text}
					name='confirmContactRemoval'
					onChange={(event: ChangeEvent<HTMLInputElement>) => setText(event.currentTarget.value)}
				/>
			</Box>
		</GenericModal>
	);
};

export default RemoveContactModal;

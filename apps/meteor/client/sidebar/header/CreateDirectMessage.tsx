import type { IUser } from '@rocket.chat/core-typings';
import { Box, Modal, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, FC } from 'react';
import React, { useState, memo } from 'react';

import UserAutoCompleteMultipleFederated from '../../components/UserAutoCompleteMultiple/UserAutoCompleteMultipleFederated';
import { useEndpointAction } from '../../hooks/useEndpointAction';
import { goToRoomById } from '../../lib/utils/goToRoomById';

type Username = Exclude<IUser['username'], undefined>;

type CreateDirectMessageProps = {
	onClose: () => void;
};

const CreateDirectMessage: FC<CreateDirectMessageProps> = ({ onClose }) => {
	const t = useTranslation();
	const [users, setUsers] = useState<Array<Username>>([]);

	const createDirect = useEndpointAction('POST', '/v1/dm.create');

	const onCreate = useMutableCallback(async (e) => {
		e.preventDefault();
		if (!users.length) return;
		try {
			const {
				room: { rid },
			} = await createDirect({ usernames: users.join(',') });

			goToRoomById(rid);
			onClose();
		} catch (error) {
			console.warn(error);
		}
	});

	return (
		<Modal
			data-qa='create-direct-modal'
			wrapperFunction={(props: ComponentProps<typeof Box>) => <Box is='form' onSubmit={onCreate} {...props} />}
		>
			<Modal.Header>
				<Modal.Title>{t('Direct_Messages')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content mbe={2}>
				<Box>{t('Direct_message_creation_description')}</Box>
				<Box mbs={16} display='flex' flexDirection='column' width='full'>
					<UserAutoCompleteMultipleFederated value={users} onChange={setUsers} />
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={users.length < 1} type='submit' primary>
						{t('Create')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default memo(CreateDirectMessage);

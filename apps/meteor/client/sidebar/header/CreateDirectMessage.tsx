import type { IUser } from '@rocket.chat/core-typings';
import { Box, Modal, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useState, memo } from 'react';

import UserAutoCompleteMultipleFederated from '../../components/UserAutoCompleteMultiple/UserAutoCompleteMultipleFederated';
import { useEndpointActionExperimental } from '../../hooks/useEndpointActionExperimental';
import { goToRoomById } from '../../lib/utils/goToRoomById';

type Username = Exclude<IUser['username'], undefined>;

type CreateDirectMessageProps = {
	onClose: () => void;
};

const CreateDirectMessage: FC<CreateDirectMessageProps> = ({ onClose }) => {
	const t = useTranslation();
	const [users, setUsers] = useState<Array<Username>>([]);

	const createDirect = useEndpointActionExperimental('POST', '/v1/dm.create');

	const onCreate = useMutableCallback(async () => {
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
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Direct_Messages')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box>{t('Direct_message_creation_description')}</Box>
				<Box mbs='x16' display='flex' flexDirection='column' width='full'>
					<UserAutoCompleteMultipleFederated value={users} onChange={setUsers} />
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={users.length < 1} onClick={onCreate} primary>
						{t('Create')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default memo(CreateDirectMessage);

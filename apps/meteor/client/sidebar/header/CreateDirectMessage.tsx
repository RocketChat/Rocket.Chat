import type { IUser } from '@rocket.chat/core-typings';
import { Box, Modal, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useState, memo } from 'react';

import UserAutoCompleteMultiple from '../../components/UserAutoCompleteMultiple';
import { useEndpointActionExperimental } from '../../hooks/useEndpointActionExperimental';
import { goToRoomById } from '../../lib/utils/goToRoomById';

type Username = IUser['username'];

type CreateDirectMessageProps = {
	onClose: () => void;
};

const CreateDirectMessage: FC<CreateDirectMessageProps> = ({ onClose }) => {
	const t = useTranslation();
	const [users, setUsers] = useState<Array<Username>>([]);

	const createDirect = useEndpointActionExperimental('POST', 'dm.create');

	const onChangeUsers = useMutableCallback((value: Username, action: string) => {
		if (!action) {
			if (users.includes(value)) {
				return;
			}
			return setUsers([...users, value]);
		}
		setUsers(users.filter((current) => current !== value));
	});

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
					<UserAutoCompleteMultiple value={users} onChange={onChangeUsers} />
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={users.length < 1} onClick={onCreate} primary>
						{t('Create')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default memo(CreateDirectMessage);

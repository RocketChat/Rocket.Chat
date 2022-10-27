import type { IUser } from '@rocket.chat/core-typings';
import { Icon, Box, Modal, Button, Field, TextInput, FieldGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useState, memo } from 'react';

import { useEndpointActionExperimental } from '../hooks/useEndpointActionExperimental';
import { goToRoomById } from '../lib/utils/goToRoomById';
import RoomAutoComplete from './RoomAutoComplete';

type Username = Exclude<IUser['username'], undefined>;

type CreateDirectMessageProps = {
	onClose: () => void;
};

const CreateDirectMessage: FC<CreateDirectMessageProps> = ({ onClose }) => {
	const t = useTranslation();
	const [rooms, setRooms] = useState<Array<Username>>([]);
	const [name, setName] = useState<string>('');

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

	const handleRoomChange = (value: unknown): void => {
		if (typeof value === 'string') {
			setRooms([...rooms, value]);
		}
	};

	const handleNameChange = (value: unknown): void => {
		if (typeof value === 'string') {
			setName(value);
		}
	};

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>Create Category</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box mbe='x12'>You are about to create a category with multiple rooms. Add the ones you would like to organize.</Box>
				<FieldGroup>
					<Field>
						<Field.Label>Category name</Field.Label>
						<Field.Row>
							<TextInput value={name} onChange={handleNameChange} addon={<Icon name='baloons' size='x20' />} placeholder='Category name' />
						</Field.Row>
					</Field>
					<Field>
						<Field.Label>Channel</Field.Label>
						<Field.Row>
							<Box display='flex' flexDirection='column' width='full'>
								<RoomAutoComplete value={rooms} onChange={handleRoomChange} placeholder={t('Discussion_target_channel_description')} />
							</Box>
						</Field.Row>
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={rooms.length < 1} onClick={onCreate} primary>
						{t('Create')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default memo(CreateDirectMessage);

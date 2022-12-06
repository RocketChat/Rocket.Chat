import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Modal, Field, FieldGroup, ToggleSwitch, TextInput, TextAreaInput, Button, Icon, Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useEndpointActionExperimental } from '../../hooks/useEndpointActionExperimental';
import { useForm } from '../../hooks/useForm';
import { goToRoomById } from '../../lib/utils/goToRoomById';
import RoomAutoComplete from '../RoomAutoComplete';
import UserAutoCompleteMultiple from '../UserAutoCompleteMultiple';
import DefaultParentRoomField from './DefaultParentRoomField';

type CreateDiscussionFormValues = {
	name: string;
	parentRoom: IRoom['_id'];
	encrypted: boolean;
	usernames: Array<IUser['username']>;
	firstMessage: string;
};

type CreateDiscussionProps = {
	parentMessageId: IMessage['_id'];
	onClose: () => void;
	defaultParentRoom?: IRoom['_id'];
	nameSuggestion?: string;
};

const CreateDiscussion = ({ onClose, defaultParentRoom, parentMessageId, nameSuggestion }: CreateDiscussionProps): ReactElement => {
	const t = useTranslation();

	const { values, handlers } = useForm({
		name: nameSuggestion || '',
		parentRoom: '',
		encrypted: false,
		usernames: [],
		firstMessage: '',
	});

	const { name, parentRoom, encrypted, usernames, firstMessage } = values as CreateDiscussionFormValues;

	const { handleName, handleParentRoom, handleEncrypted, handleUsernames, handleFirstMessage } = handlers;

	const canCreate = (parentRoom || defaultParentRoom) && name;

	const createDiscussion = useEndpointActionExperimental('POST', '/v1/rooms.createDiscussion');

	const create = useMutableCallback(async (): Promise<void> => {
		try {
			const result = await createDiscussion({
				prid: defaultParentRoom || parentRoom,
				t_name: name,
				users: usernames,
				reply: encrypted ? undefined : firstMessage,
				...(parentMessageId && { pmid: parentMessageId }),
			});

			goToRoomById(result.discussion._id);
			onClose();
		} catch (error) {
			console.warn(error);
		}
	});

	const onChangeUsers = useMutableCallback((value, action) => {
		if (!action) {
			if (usernames.includes(value)) {
				return;
			}
			return handleUsernames([...usernames, value]);
		}
		handleUsernames(usernames.filter((current) => current !== value));
	});

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Discussion_title')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<Field.Description>{t('Discussion_description')}</Field.Description>
					</Field>
					<Field>
						<Field.Label>{t('Discussion_target_channel')}</Field.Label>
						<Field.Row>
							{defaultParentRoom && <DefaultParentRoomField defaultParentRoom={defaultParentRoom} />}

							{!defaultParentRoom && (
								<RoomAutoComplete
									value={parentRoom}
									onChange={handleParentRoom}
									placeholder={t('Discussion_target_channel_description')}
									disabled={Boolean(defaultParentRoom)}
								/>
							)}
						</Field.Row>
					</Field>
					<Field display='flex' alignItems='center' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Box display='flex' flexDirection='column' width='full'>
							<Field.Label>{t('Encrypted')}</Field.Label>
						</Box>
						<ToggleSwitch checked={encrypted} onChange={handleEncrypted} />
					</Field>
					<Field>
						<Field.Label>{t('Discussion_name')}</Field.Label>
						<Field.Row>
							<TextInput
								value={name}
								onChange={handleName}
								addon={<Icon name='baloons' size='x20' />}
								placeholder={t('New_discussion_name')}
							/>
						</Field.Row>
					</Field>
					<Field>
						<Field.Label>{t('Invite_Users')}</Field.Label>
						<Field.Row w='full' display='flex' flexDirection='column' alignItems='stretch'>
							<UserAutoCompleteMultiple value={usernames} onChange={onChangeUsers} placeholder={t('Username_Placeholder')} />
						</Field.Row>
					</Field>
					<Field>
						<Field.Label>{t('Discussion_first_message_title')}</Field.Label>
						<Field.Row>
							<TextAreaInput
								value={firstMessage}
								onChange={handleFirstMessage}
								placeholder={t('New_discussion_first_message')}
								rows={5}
								disabled={encrypted}
							/>
						</Field.Row>
						{encrypted && <Field.Description>{t('Discussion_first_message_disabled_due_to_e2e')}</Field.Description>}
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary disabled={!canCreate} onClick={create}>
						{t('Create')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default CreateDiscussion;

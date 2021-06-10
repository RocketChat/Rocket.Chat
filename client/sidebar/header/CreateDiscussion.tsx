import {
	Modal,
	Field,
	FieldGroup,
	ToggleSwitch,
	TextInput,
	TextAreaInput,
	ButtonGroup,
	Button,
	Icon,
} from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement } from 'react';

import { IRoom } from '../../../definition/IRoom';
import { IUser } from '../../../definition/IUser';
import RoomAutoComplete from '../../components/RoomAutoComplete';
import UserAutoCompleteMultiple from '../../components/UserAutoCompleteMultiple';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointActionExperimental } from '../../hooks/useEndpointAction';
import { useForm } from '../../hooks/useForm';
import { goToRoomById } from '../../lib/goToRoomById';

type CreateDiscussionFormValues = {
	name: string;
	parentRoom: IRoom['_id'];
	encrypted: boolean;
	usernames: Array<IUser['username']>;
	firstMessage: string;
};

type CreateDiscussionProps = {
	onClose: () => void;
	defaultParentRoom?: IRoom['_id'];
	defaultParentRoomName?: string;
};

/*
 ** TO-DO: For other discussion creation locations, some default props should be provided
 ** such as the parent room or parent message. This component does not support this
 ** behavior at this time, but should be implemented when needed.
 */

const CreateDiscussion = ({ onClose, defaultParentRoom }: CreateDiscussionProps): ReactElement => {
	const t = useTranslation();

	const { values, handlers } = useForm({
		name: '',
		parentRoom: '',
		encrypted: false,
		usernames: [],
		firstMessage: '',
	});

	const {
		name,
		parentRoom,
		encrypted,
		usernames,
		firstMessage,
	} = values as CreateDiscussionFormValues;

	const {
		handleName,
		handleParentRoom,
		handleEncrypted,
		handleUsernames,
		handleFirstMessage,
	} = handlers;

	const canCreate = (parentRoom || defaultParentRoom) && name;

	const createDiscussion = useEndpointActionExperimental('POST', 'rooms.createDiscussion');

	const create = useMutableCallback(
		async (): Promise<void> => {
			try {
				const result = await createDiscussion({
					prid: defaultParentRoom || parentRoom,
					// eslint-disable-next-line @typescript-eslint/camelcase
					t_name: name,
					users: usernames,
					reply: encrypted ? undefined : firstMessage,
				});

				goToRoomById(result?.discussion?.rid);
				onClose();
			} catch (error) {
				console.warn(error);
			}
		},
	);

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
							<RoomAutoComplete
								value={parentRoom}
								onChange={handleParentRoom}
								placeholder={t('Discussion_target_channel_description')}
								disabled={defaultParentRoom}
							/>
						</Field.Row>
					</Field>
					<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label>{t('Encrypted')}</Field.Label>
						<Field.Row>
							<ToggleSwitch checked={encrypted} onChange={handleEncrypted} />
						</Field.Row>
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
						<Field.Row>
							<UserAutoCompleteMultiple
								value={usernames}
								onChange={onChangeUsers}
								placeholder={t('Username_Placeholder')}
							/>
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
						{encrypted && (
							<Field.Description>
								{t('Discussion_first_message_disabled_due_to_e2e')}
							</Field.Description>
						)}
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button primary disabled={!canCreate} onClick={create}>
						{t('Create')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default CreateDiscussion;

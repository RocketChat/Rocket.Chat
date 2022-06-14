import { Modal, Box, Field, FieldGroup, ButtonGroup, Button, TextAreaInput, Message } from '@rocket.chat/fuselage';
import React, { ReactElement, memo } from 'react';

import UserAutoCompleteMultiple from '../../../../components/UserAutoCompleteMultiple';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { useForm } from '../../../../hooks/useForm';
import { formatTime } from '../../../../lib/utils/formatTime';

type ShareMessageProps = {
	onClose: () => void;
	onSubmit: (name: string, description?: string) => void;
	message: string;
	username: string;
	time: Date;
	invalidContentType: boolean;
};

const ShareMessageModal = ({ onClose, message, username, time }: ShareMessageProps): ReactElement => {
	// const [name, setName] = useState<string>(fileName);
	// const [description, setDescription] = useState<string>(fileDescription || '');
	const t = useTranslation();
	const { handlers } = useForm({
		description: 'fj',
		usernames: [],
	});

	const { handleDescription } = handlers;

	return (
		<Modal>
			<Box is='form' display='flex' flexDirection='column' height='100%'>
				<Modal.Header>
					<Modal.Title>{t('Share_Message_Title')}</Modal.Title>
					<Modal.Close onClick={onClose} />
				</Modal.Header>
				<Modal.Content overflow='hidden'>
					<FieldGroup>
						<Field>
							<Field.Label>{t('Person_Or_Channel')}</Field.Label>

							<Field.Row>
								<UserAutoCompleteMultiple />
							</Field.Row>
							{/* {!name && <Field.Error>{t('error-the-field-is-required', { field: t('Name') })}</Field.Error>} */}
						</Field>
						<Field>
							<Field.Label>{t('Add_Message')}</Field.Label>
							<Field.Row>
								<TextAreaInput onChange={handleDescription} rows={5} />
							</Field.Row>
							{/* {!name && <Field.Error>{t('error-the-field-is-required', { field: t('Name') })}</Field.Error>} */}
						</Field>
						<Field>
							<Box>
								<Message className='customclass' clickable>
									<Message.LeftContainer>
										<UserAvatar username={username} size='x20' />
									</Message.LeftContainer>
									<Message.Container>
										<Message.Header>
											<Message.Name>{username}</Message.Name>
											{/* <Message.Username>@haylie.george</Message.Username>
											<Message.Role>Admin</Message.Role>
											<Message.Role>User</Message.Role>
											<Message.Role>Owner</Message.Role> */}
											<Message.Timestamp>{formatTime(time)}</Message.Timestamp>
										</Message.Header>
										<Message.Body style={{ wordBreak: 'break-word' }}>{message}</Message.Body>
									</Message.Container>
								</Message>
							</Box>
						</Field>
					</FieldGroup>
				</Modal.Content>
				<Modal.Footer>
					<ButtonGroup align='end'>
						<Button ghost>{t('Copy_Link')}</Button>
						<Button primary type='submit'>
							{t('Share_message')}
						</Button>
					</ButtonGroup>
				</Modal.Footer>
			</Box>
		</Modal>
	);
};

export default memo(ShareMessageModal);
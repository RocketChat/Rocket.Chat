import { Modal, Box, Field, FieldGroup, ButtonGroup, Button, Message } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, memo, useState, ChangeEvent } from 'react';

import MarkdownTextEditor from '../../../../../ee/client/omnichannel/components/CannedResponse/MarkdownTextEditor';
import PreviewText from '../../../../../ee/client/omnichannel/components/CannedResponse/modals/CreateCannedResponse/PreviewText';
import UserAutoCompleteMultiple from '../../../../components/UserAutoCompleteMultiple';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { formatTime } from '../../../../lib/utils/formatTime';

type ShareMessageProps = {
	onClose: () => void;
	onSubmit?: (name: string, description?: string) => void;
	message: string;
	username: string;
	time?: Date;
	invalidContentType?: boolean;
};

const ShareMessageModal = ({ onClose, message, username, time }: ShareMessageProps): ReactElement => {
	const [value, setValue] = useState('');
	const [preview, setPreview] = useState(false);
	const t = useTranslation();

	const changeEditView = (e: ChangeEvent<HTMLInputElement> | string) => {
		if (typeof e === 'string') setValue(e);
		else setValue(e.target.value);
	};
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
								<UserAutoCompleteMultiple value='' onChange={() => null} />
							</Field.Row>
							{/* {!name && <Field.Error>{t('error-the-field-is-required', { field: t('Name') })}</Field.Error>} */}
						</Field>

						<Field mbe='x24'>
							<Field.Label w='full'>
								<Box w='full' display='flex' flexDirection='row' justifyContent='space-between'>
									{t('Add_Message')}
									<Box color='link' onClick={() => setPreview(!preview)}>
										{preview ? t('Editor') : t('Preview')}
									</Box>
								</Box>
							</Field.Label>
							{preview ? <PreviewText text={value} /> : <MarkdownTextEditor value={value} onChange={changeEditView} />}
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

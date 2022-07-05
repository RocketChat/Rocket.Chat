import type { IUser } from '@rocket.chat/core-typings';
import { Modal, Box, Field, FieldGroup, ButtonGroup, Button, Message, Tabs } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, memo, useState, ChangeEvent } from 'react';

import MarkdownTextEditor from '../../../../../ee/client/omnichannel/components/CannedResponse/MarkdownTextEditor';
import PreviewText from '../../../../../ee/client/omnichannel/components/CannedResponse/modals/CreateCannedResponse/PreviewText';
import AutoCompleteMultiple from '../../../../components/AutoCompleteMultiple';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useForm } from '../../../../hooks/useForm';
import { formatTime } from '../../../../lib/utils/formatTime';

type ShareMessageFormValue = {
	optionalMessage: string;
	usernames: Array<IUser['username']>;
};

type ShareMessageProps = {
	onClose: () => void;
	onSubmit?: (name: string, description?: string) => void;
	message: string;
	username: string;
	name: string;
	time?: Date;
	invalidContentType?: boolean;
};

const ShareMessageModal = ({ onClose, message, username, name, time }: ShareMessageProps): ReactElement => {
	const [status, setStatus] = useState(0);
	const t = useTranslation();

	const { values, handlers } = useForm({
		optionalMessage: '',
		usernames: [],
	});

	const { usernames, optionalMessage } = values as ShareMessageFormValue;

	const { handleUsernames, handleOptionalMessage } = handlers;

	const onChangeUsers = useMutableCallback((value: any, action: any) => {
		if (!action) {
			if (usernames.includes(value)) {
				return;
			}
			return handleUsernames([...usernames, value]);
		}
		handleUsernames(usernames.filter((current) => current !== value));
	});

	const changeEditView = (e: ChangeEvent<HTMLInputElement> | string): void => {
		if (typeof e === 'string') handleOptionalMessage(e);
		else handleOptionalMessage(e.target.value);
	};
	const changeStatus = (e: any, value: any) => {
		e.preventDefault();
		setStatus(value);
	};
	return (
		<Modal>
			<Box is='form' display='flex' flexDirection='column' height='100%'>
				<Modal.Header>
					<Modal.Title title={t('Close')}>{t('Share_Message')}</Modal.Title>
					<Modal.Close onClick={onClose} />
				</Modal.Header>
				<Modal.Content overflow='hidden'>
					<FieldGroup>
						<Field>
							<Field.Label>{t('Person_Or_Channel')}</Field.Label>
							<Field.Row>
								<AutoCompleteMultiple value={usernames} onChange={onChangeUsers} />
							</Field.Row>
							{/* {!name && <Field.Error>{t('error-the-field-is-required', { field: t('Name') })}</Field.Error>} */}
						</Field>
						<Field mbe='x24'>
							<Field.Label w='full'>
								{/* <Box w='full' display='flex' flexDirection='row' justifyContent='space-between'>
									{`${t('Add_Message')} (${t('Optional')})`}
									<Box color='link' onClick={(): void => setPreview(!preview)}>
										{preview ? t('Editor') : t('Preview')}
									</Box>
								</Box> */}
								<Tabs>
									<Tabs.Item onClick={(e) => changeStatus(e, 0)} selected={!status}>
										Editor
									</Tabs.Item>
									<Tabs.Item onClick={(e) => changeStatus(e, 1)} selected={status === 1}>
										Preview
									</Tabs.Item>
								</Tabs>
								{status ? <PreviewText text={optionalMessage} /> : <MarkdownTextEditor value={optionalMessage} onChange={changeEditView} />}
							</Field.Label>
						</Field>
						<Field>
							<Message className='customclass' clickable>
								<Message.LeftContainer>
									<UserAvatar username={username} size='x20' />
								</Message.LeftContainer>
								<Message.Container>
									<Message.Header>
										<Message.Name>{name}</Message.Name>
										<Message.Username>@{username}</Message.Username>
										<Message.Timestamp>{formatTime(time)}</Message.Timestamp>
									</Message.Header>
									<Message.Body style={{ wordBreak: 'break-word' }}>{message}</Message.Body>
								</Message.Container>
							</Message>
						</Field>
					</FieldGroup>
				</Modal.Content>
				<Modal.Footer>
					<ButtonGroup align='end'>
						<Button>{t('Copy_Link')}</Button>
						<Button primary type='submit'>
							{t('Share')}
						</Button>
					</ButtonGroup>
				</Modal.Footer>
			</Box>
		</Modal>
	);
};

export default memo(ShareMessageModal);

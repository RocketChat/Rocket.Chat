import { Modal, Box, Field, FieldGroup, ButtonGroup, Button, Message, Tabs } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import React, { ReactElement, memo, useState, ChangeEvent } from 'react';

import MarkdownTextEditor from '../../../../../ee/client/omnichannel/components/CannedResponse/MarkdownTextEditor';
import PreviewText from '../../../../../ee/client/omnichannel/components/CannedResponse/modals/CreateCannedResponse/PreviewText';
import AutoCompleteMultiple from '../../../../components/AutoCompleteMultiple';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import Attachment from '../../../../components/message/Attachments';
import { useForm } from '../../../../hooks/useForm';
import { formatTime } from '../../../../lib/utils/formatTime';

type ShareMessageFormValue = {
	optionalMessage: string;
	rooms: any;
};

type ShareMessageProps = {
	onClose: () => void;
	onSubmit?: (name: string, description?: string) => void;
	message: string;
	username: string;
	name: string;
	time?: Date;
	attachments: any;
	invalidContentType?: boolean;
};
type roomType = {
	label: string;
	value: string;
	_id: string;
	type: string;
};
const ShareMessageModal = ({ onClose, message, username, name, time, attachments }: ShareMessageProps): ReactElement => {
	const [status, setStatus] = useState(0);
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { values, handlers } = useForm({
		optionalMessage: '',
		rooms: [],
	});

	const { rooms, optionalMessage } = values as ShareMessageFormValue;

	const { handleRooms, handleOptionalMessage } = handlers;
	const sendMessage = useEndpoint('POST', '/v1/chat.postMessage');
	const onChangeUsers = useMutableCallback((room: roomType, action: any) => {
		if (!action) {
			if (rooms.find((cur: roomType) => cur._id === room._id)) return;
			return handleRooms([...rooms, room]);
		}
		handleRooms(rooms.filter((cur: roomType) => cur._id !== room._id));
	});

	const changeEditView = useMutableCallback((e: ChangeEvent<HTMLInputElement> | string): void => {
		if (typeof e === 'string') handleOptionalMessage(e);
		else handleOptionalMessage(e.target.value);
	});

	const changeStatus = (e: any, value: any) => {
		e.preventDefault();
		setStatus(value);
	};

	const handleSubmit = useMutableCallback((e: any) => {
		e.preventDefault();
		let flag = true;
		rooms.forEach(async ({ _id, type, value }: any) => {
			const sendPayload = {
				roomId: _id,
				channel: (type === 'C' ? '#' : '@') + value,
				text: optionalMessage,
				attachments,
			};
			const result: any = await sendMessage(sendPayload as never);
			if (!result.success) flag = false;
		});
		if (flag) {
			dispatchToastMessage({ type: 'success', message: 'Message shared successfully' });
			onClose();
		}
	});

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
								<AutoCompleteMultiple value={rooms.map((room: any) => room.value)} onChange={onChangeUsers} />
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
									<Message.Body style={{ wordBreak: 'break-word' }}>
										{attachments?.[0]?.image_type || attachments?.[0]?.text ? (
											<Attachment attachments={attachments} />
										) : (
											attachments?.[0]?.title
										)}
										<br />
										{!attachments?.[0]?.text ? message : null}
										{attachments?.[0]?.description}
									</Message.Body>
								</Message.Container>
							</Message>
						</Field>
					</FieldGroup>
				</Modal.Content>
				<Modal.Footer>
					<ButtonGroup align='end'>
						<Button>{t('Copy_Link')}</Button>
						<Button onClick={handleSubmit} primary type='submit'>
							{t('Share')}
						</Button>
					</ButtonGroup>
				</Modal.Footer>
			</Box>
		</Modal>
	);
};

export default memo(ShareMessageModal);

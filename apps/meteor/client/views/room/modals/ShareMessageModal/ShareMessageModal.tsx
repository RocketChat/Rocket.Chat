import { IMessage } from '@rocket.chat/core-typings';
import { Modal, Box, Field, FieldGroup, ButtonGroup, Button, Tabs } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import React, { ReactElement, memo, useState, ChangeEvent, MouseEventHandler } from 'react';
import { useForm, Controller } from 'react-hook-form';

import MarkdownTextEditor from '../../../../../ee/client/omnichannel/components/CannedResponse/MarkdownTextEditor';
import PreviewText from '../../../../../ee/client/omnichannel/components/CannedResponse/modals/CreateCannedResponse/PreviewText';
import UserAndRoomAutoCompleteMultiple from '../../../../components/UserAndRoomAutoCompleteMultiple.tsx';
import { prependReplies } from '../../../../lib/utils/prependReplies';
import Message from '../../MessageList/components/Message';

type ShareMessageProps = {
	onClose: () => void;
	onSubmit?: (name: string, description?: string) => void;
	message: IMessage;
};
type roomType = {
	label: string;
	value: string;
	_id: string;
	type: string;
};
const ShareMessageModal = ({ onClose, message }: ShareMessageProps): ReactElement => {
	const [status, setStatus] = useState<number>(0);
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { control, watch } = useForm({
		defaultValues: {
			optionalMessage: '',
			rooms: [],
		},
	});
	const rooms = watch('rooms');
	const sendMessage = useEndpoint('POST', '/v1/chat.postMessage');

	const onChangeUserOrRoom = useMutableCallback((handleRoomsAndUsers: (rooms: roomType[]) => void, room: roomType, action?: string) => {
		if (!action) {
			if (rooms.find((cur: roomType) => cur._id === room._id)) return;
			return handleRoomsAndUsers([...rooms, room]);
		}
		handleRoomsAndUsers(rooms.filter((cur: roomType) => cur._id !== room._id));
	});

	const changeEditView = (e: ChangeEvent<HTMLInputElement> | string, handleOptionalMessage: (val: string) => void): void => {
		if (typeof e === 'string') handleOptionalMessage(e);
		else handleOptionalMessage(e.target.value);
	};
	const changeStatus = (e: any, value: number): void => {
		e.preventDefault();
		setStatus(value);
	};

	const handleShareMessage: MouseEventHandler<HTMLFormElement> = async (e) => {
		e.preventDefault();
		const optionalMessage = watch('optionalMessage');
		let flag = true;
		const curMsg = await prependReplies(optionalMessage, [message], false);
		rooms.map(async (room: roomType) => {
			const sendPayload = {
				roomId: room._id,
				channel: (room.type === 'C' ? '#' : '@') + room.value,
				text: curMsg,
			};
			const result: any = await sendMessage(sendPayload as never);
			if (!result.success) flag = false;
		});
		if (flag) {
			dispatchToastMessage({ type: 'success', message: 'Message shared successfully' });
			onClose();
		}
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
								<Controller
									name='rooms'
									control={control}
									render={({ field }): ReactElement => (
										<UserAndRoomAutoCompleteMultiple
											value={field.value.map((room: roomType) => room.value)}
											onChange={(room, action): void => onChangeUserOrRoom(field.onChange, room, action)}
										/>
									)}
								/>
							</Field.Row>
							{!rooms.length && <Field.Hint>{t('Select_atleast_one_channel_to_share_the_messsage')}</Field.Hint>}
						</Field>
						<Field mbe='x24'>
							<Field.Label w='full'>
								<Tabs>
									<Tabs.Item onClick={(e): void => changeStatus(e, 0)} selected={!status}>
										Editor
									</Tabs.Item>
									<Tabs.Item onClick={(e): void => changeStatus(e, 1)} selected={status === 1}>
										Preview
									</Tabs.Item>
								</Tabs>
								<Controller
									name='optionalMessage'
									control={control}
									render={({ field }): ReactElement =>
										status ? (
											<PreviewText text={field.value} />
										) : (
											<MarkdownTextEditor value={field.value} onChange={(e: any): void => changeEditView(e, field.onChange)} />
										)
									}
								/>
							</Field.Label>
						</Field>
						<Field>
							<Message
								id={message._id}
								data-id={message._id}
								data-system-message={Boolean(message.t)}
								data-mid={message._id}
								data-unread={false}
								data-sequential={false}
								data-own={true}
								data-qa-type='message'
								sequential={false}
								message={message}
							/>
						</Field>
					</FieldGroup>
				</Modal.Content>
				<Modal.Footer>
					<ButtonGroup align='end'>
						<Button>{t('Copy_Link')}</Button>
						<Button disabled={!rooms.length} onClick={handleShareMessage} primary type='submit'>
							{t('Share')}
						</Button>
					</ButtonGroup>
				</Modal.Footer>
			</Box>
		</Modal>
	);
};

export default memo(ShareMessageModal);

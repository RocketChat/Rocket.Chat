import type { IMessage, MessageQuoteAttachment } from '@rocket.chat/core-typings';
import {
	Modal,
	Field,
	FieldGroup,
	FieldLabel,
	FieldRow,
	FieldHint,
	ButtonGroup,
	Button,
	ModalHeader,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
} from '@rocket.chat/fuselage';
import { useClipboard } from '@rocket.chat/fuselage-hooks';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint, useToastMessageDispatch, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { memo, useId } from 'react';
import { useForm, Controller } from 'react-hook-form';

import UserAndRoomAutoCompleteMultiple from '../../../../components/UserAndRoomAutoCompleteMultiple';
import { QuoteAttachment } from '../../../../components/message/content/attachments/QuoteAttachment';
import { prependReplies } from '../../../../lib/utils/prependReplies';

type ForwardMessageProps = {
	onClose: () => void;
	permalink: string;
	message: IMessage;
};

const ForwardMessageModal = ({ onClose, permalink, message }: ForwardMessageProps): ReactElement => {
	const t = useTranslation();
	const getUserAvatarPath = useUserAvatarPath();
	const dispatchToastMessage = useToastMessageDispatch();
	const { copy, hasCopied } = useClipboard(permalink);
	const usersAndRoomsField = useId();

	const { control, watch } = useForm({
		defaultValues: {
			rooms: [],
		},
	});

	const rooms = watch('rooms');
	const sendMessage = useEndpoint('POST', '/v1/chat.postMessage');

	const sendMessageMutation = useMutation({
		mutationFn: async () => {
			const optionalMessage = '';
			const curMsg = await prependReplies(optionalMessage, [message]);
			const sendPayload = {
				roomId: rooms,
				text: curMsg,
			};

			return sendMessage(sendPayload);
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Message_has_been_forwarded') });
		},
		onError: (error: any) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			onClose();
		},
	});

	const avatarUrl = getUserAvatarPath(message.u.username);

	const displayName = useUserDisplayName(message.u);

	const attachment = {
		author_name: String(displayName),
		author_link: '',
		author_icon: avatarUrl,
		message_link: '',
		text: message.msg,
		attachments: message.attachments as MessageQuoteAttachment[],
		md: message.md,
	};

	const handleCopy = (): void => {
		if (!hasCopied) {
			copy();
		}
	};

	return (
		<Modal>
			<ModalHeader>
				<ModalTitle>{t('Forward_message')}</ModalTitle>
				<ModalClose onClick={onClose} title={t('Close')} />
			</ModalHeader>
			<ModalContent>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={usersAndRoomsField}>{t('Person_Or_Channel')}</FieldLabel>
						<FieldRow>
							<Controller
								name='rooms'
								control={control}
								render={({ field: { name, value, onChange } }): ReactElement => (
									<UserAndRoomAutoCompleteMultiple
										id={usersAndRoomsField}
										aria-describedby={`${usersAndRoomsField}-hint`}
										name={name}
										value={value}
										limit={25}
										onChange={onChange}
									/>
								)}
							/>
						</FieldRow>
						{!rooms.length && (
							<FieldHint id={`${usersAndRoomsField}-hint`}>{t('Select_atleast_one_channel_to_forward_the_messsage_to')}</FieldHint>
						)}
					</Field>
					<Field>
						<QuoteAttachment attachment={attachment} />
					</Field>
				</FieldGroup>
			</ModalContent>
			<ModalFooter>
				<ButtonGroup>
					<Button onClick={handleCopy} disabled={hasCopied}>
						{hasCopied ? t('Copied') : t('Copy_Link')}
					</Button>
					<Button disabled={!rooms.length} loading={sendMessageMutation.isPending} onClick={() => sendMessageMutation.mutate()} primary>
						{t('Forward')}
					</Button>
				</ButtonGroup>
			</ModalFooter>
		</Modal>
	);
};

export default memo(ForwardMessageModal);

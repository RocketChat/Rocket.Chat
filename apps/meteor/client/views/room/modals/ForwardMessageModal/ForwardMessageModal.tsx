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
	Box,
} from '@rocket.chat/fuselage';
import { useClipboard } from '@rocket.chat/fuselage-hooks';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint, useToastMessageDispatch, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { memo, useId, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import UserAndRoomAutoCompleteMultiple from '../../../../components/UserAndRoomAutoCompleteMultiple';
import { QuoteAttachment } from '../../../../components/message/content/attachments/QuoteAttachment';
import { prependReplies } from '../../../../lib/utils/prependReplies';

type ForwardMessageProps = {
	onClose: () => void;
	permalink?: string;
	message?: IMessage;
	messages?: IMessage[];
};

const ForwardQuotePreview = memo(({ message }: { message: IMessage }) => {
	const getUserAvatarPath = useUserAvatarPath();
	const displayName = useUserDisplayName(message.u);
	const avatarUrl = getUserAvatarPath(message.u.username);

	const attachment = useMemo(
		() => ({
			author_name: String(displayName),
			author_link: '',
			author_icon: avatarUrl,
			message_link: '',
			text: message.msg,
			attachments: message.attachments as MessageQuoteAttachment[],
			md: message.md,
		}),
		[displayName, avatarUrl, message.msg, message.attachments, message.md],
	);

	return <QuoteAttachment attachment={attachment} />;
});

ForwardQuotePreview.displayName = 'ForwardQuotePreview';

const ForwardMessageModal = ({ onClose, permalink = '', message, messages }: ForwardMessageProps) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { copy, hasCopied } = useClipboard(permalink);
	const usersAndRoomsField = useId();

	const messageList = useMemo(() => {
		const list = messages?.length ? messages : message ? [message] : [];
		return [...list].sort((a, b) => {
			const timeA = a.ts instanceof Date ? a.ts.getTime() : new Date(a.ts).getTime();
			const timeB = b.ts instanceof Date ? b.ts.getTime() : new Date(b.ts).getTime();
			return timeA - timeB;
		});
	}, [messages, message]);

	const { control, watch } = useForm({
		defaultValues: {
			rooms: [],
		},
	});

	const rooms = watch('rooms');
	const sendMessage = useEndpoint('POST', '/v1/chat.postMessage');

	const sendMessageMutation = useMutation({
		mutationFn: async () => {
			const failedMessages: IMessage[] = [];

			for (const msg of messageList) {
				try {
					const curMsg = await prependReplies('', [msg]);
					await sendMessage({
						roomId: rooms,
						text: curMsg,
					});
				} catch {
					failedMessages.push(msg);
				}
			}

			if (failedMessages.length > 0) {
				throw new Error(t('error-forwarding-chat'));
			}
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

	const handleCopy = (): void => {
		if (!hasCopied && permalink) {
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
								render={({ field: { name, value, onChange } }) => (
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
						<Box maxHeight='x240' overflowY='auto' display='flex' flexDirection='column' gap='x8' paddingInline='x4'>
							{messageList.map((msg) => (
								<ForwardQuotePreview key={msg._id} message={msg} />
							))}
						</Box>
					</Field>
				</FieldGroup>
			</ModalContent>
			<ModalFooter>
				<ButtonGroup>
					{permalink && (
						<Button onClick={handleCopy} disabled={hasCopied}>
							{hasCopied ? t('Copied') : t('Copy_Link')}
						</Button>
					)}
					<Button
						disabled={!rooms.length || messageList.length === 0}
						loading={sendMessageMutation.isPending}
						onClick={() => sendMessageMutation.mutate()}
						primary
					>
						{t('Forward')}
					</Button>
				</ButtonGroup>
			</ModalFooter>
		</Modal>
	);
};

export default memo(ForwardMessageModal);

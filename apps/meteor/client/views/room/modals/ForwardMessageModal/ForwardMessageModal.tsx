import { getUserDisplayName } from '@rocket.chat/core-typings';
import type { IMessage, MessageMention, MessageQuoteAttachment } from '@rocket.chat/core-typings';
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
	MultiSelect,
} from '@rocket.chat/fuselage';
import { useClipboard } from '@rocket.chat/fuselage-hooks';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useEndpoint, useSetting, useToastMessageDispatch, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { memo, useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import UserAndRoomAutoCompleteMultiple from '../../../../components/UserAndRoomAutoCompleteMultiple';
import UserAvatarChip from '../../../../components/UserAutoCompleteMultiple/UserAvatarChip';
import { QuoteAttachment } from '../../../../components/message/content/attachments/QuoteAttachment';
import { prependReplies } from '../../../../lib/utils/prependReplies';

export type DMRecipient = MessageMention & { username: string };

type ForwardMessageProps = {
	onClose: () => void;
	permalink: string;
	message: IMessage;
	dmRecipients?: {
		users: DMRecipient[];
		forward: (users: DMRecipient[]) => Promise<unknown>;
	};
};

const ForwardMessageModal = ({ onClose, permalink, message, dmRecipients }: ForwardMessageProps) => {
	const { t } = useTranslation();
	const getUserAvatarPath = useUserAvatarPath();
	const dispatchToastMessage = useToastMessageDispatch();
	const { copy, hasCopied } = useClipboard(permalink);
	const usersAndRoomsField = useId();
	const useRealName = useSetting('UI_Use_Real_Name', false);

	const { control, watch } = useForm({
		defaultValues: {
			rooms: [],
			dmUsernames: dmRecipients?.users.map(({ username }) => username) ?? [],
		},
	});

	const rooms = watch('rooms');
	const dmUsernames = watch('dmUsernames');
	const hasRecipients = dmRecipients ? dmUsernames.length > 0 : rooms.length > 0;
	const sendMessage = useEndpoint('POST', '/v1/chat.postMessage');

	const sendMessageMutation = useMutation({
		mutationFn: async () => {
			if (dmRecipients) {
				return dmRecipients.forward(dmRecipients.users.filter(({ username }) => dmUsernames.includes(username)));
			}

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
							{dmRecipients ? (
								<Controller
									name='dmUsernames'
									control={control}
									render={({ field: { name, value, onChange } }) => (
										<MultiSelect
											id={usersAndRoomsField}
											aria-describedby={`${usersAndRoomsField}-hint`}
											name={name}
											value={value}
											options={dmRecipients.users.map(({ username, name }) => [
												username,
												getUserDisplayName(name, username, useRealName) ?? username,
											])}
											onChange={onChange}
											renderSelected={({ value, label, onMouseDown, onClick }) => (
												<UserAvatarChip
													key={value}
													username={String(value)}
													name={label ? String(label) : undefined}
													onMouseDown={onMouseDown}
													onClick={onClick}
												/>
											)}
										/>
									)}
								/>
							) : (
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
							)}
						</FieldRow>
						{!hasRecipients && (
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
					<Button
						disabled={!hasRecipients}
						loading={sendMessageMutation.isPending}
						onClick={() => sendMessageMutation.mutate()}
						variant='primary'
					>
						{t('Forward')}
					</Button>
				</ButtonGroup>
			</ModalFooter>
		</Modal>
	);
};

export default memo(ForwardMessageModal);

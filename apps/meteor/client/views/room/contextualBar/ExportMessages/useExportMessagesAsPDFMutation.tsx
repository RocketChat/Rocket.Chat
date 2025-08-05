import { Document, Image, Page, pdf, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { IMessage, MessageAttachmentDefault } from '@rocket.chat/core-typings';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { MessageTypes } from '../../../../../app/ui-utils/lib/MessageTypes';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import { Messages } from '../../../../stores';

const leftTab = {
	marginLeft: 20,
};

const pdfStyles = StyleSheet.create({
	messageHeader: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: 10,
	},
	username: {
		color: '#000',
		fontSize: 14,
	},
	dateTime: {
		color: '#aaa',
		fontSize: 12,
	},
	threadMessagesCount: {
		color: '#000',
		fontSize: 14,
	},
	threadMessage: {
		color: '#555',
		fontSize: 12,
		...leftTab,
	},
	message: {
		color: '#555',
		fontSize: 14,
	},
});

export const useExportMessagesAsPDFMutation = () => {
	const { t } = useTranslation();
	const chatopsUsername = useSetting('Chatops_Username');
	const formatDateAndTime = useFormatDateAndTime();
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: async (messageIds: IMessage['_id'][]) => {
			const parseMessage = (msg: IMessage) => {
				const messageType = MessageTypes.getType(msg);
				if (messageType) {
					if (messageType.template) {
						// Render message
						return;
					}
					if (messageType.message) {
						const data = (typeof messageType.data === 'function' && messageType.data(msg)) || {};
						return t(messageType.message, data);
					}
				}
				if (msg.u && msg.u.username === chatopsUsername) {
					msg.html = msg.msg;
					return msg.html;
				}
				msg.html = msg.msg;
				if (msg.html.trim() !== '') {
					msg.html = escapeHTML(msg.html);
				}
				return msg.html;
			};

			const messages = Messages.state.filter((record) => messageIds.includes(record._id)).sort((a, b) => a.ts.getTime() - b.ts.getTime());

			const jsx = (
				<Document>
					<Page size='A4'>
						<View style={{ margin: 10 }}>
							{messages.map((message) => {
								const dateTime = formatDateAndTime(message.ts);
								return (
									<View key={message._id} style={{ marginBottom: 10 }}>
										<View style={pdfStyles.messageHeader}>
											<Text style={{ ...(message.tmid ? leftTab : {}), ...pdfStyles.username }}>{message.u.username}</Text>
											<Text style={pdfStyles.dateTime}>{dateTime}</Text>
											{message.tcount && <Text style={pdfStyles.threadMessagesCount}>{`${message.tcount} ${t('thread_messages')}`}</Text>}
										</View>
										<Text style={message.tmid ? pdfStyles.threadMessage : pdfStyles.message}>{parseMessage(message)}</Text>
										{message.attachments?.map((attachment: MessageAttachmentDefault, index) => (
											<View key={index}>
												{attachment.description && <Text style={pdfStyles.message}>{attachment.description}</Text>}
												{attachment.image_url && <Image src={attachment.title_link} style={attachment.image_dimensions} />}
												<Text style={pdfStyles.message}>{attachment.title}</Text>
											</View>
										))}
									</View>
								);
							})}
						</View>
					</Page>
				</Document>
			);

			const instance = pdf();

			await new Promise<void>((resolve, reject) => {
				const callback = async () => {
					const link = document.createElement('a');
					link.href = URL.createObjectURL(await instance.toBlob());
					link.download = `exportedMessages-${new Date().toISOString()}.pdf`;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					URL.revokeObjectURL(link.href);
					resolve();
				};

				try {
					instance.on('change', callback);
					instance.updateContainer(jsx);
				} catch (error) {
					reject(error);
				} finally {
					instance.removeListener('change', callback);
				}
			});
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Messages_exported_successfully') });
		},
	});
};

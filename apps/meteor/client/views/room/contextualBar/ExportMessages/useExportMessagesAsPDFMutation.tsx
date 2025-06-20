import { Document, Page, pdf, Text, View } from '@react-pdf/renderer';
import type { IMessage } from '@rocket.chat/core-typings';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { Messages } from '../../../../../app/models/client';
import { MessageTypes } from '../../../../../app/ui-utils/lib/MessageTypes';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';

export const useExportMessagesAsPDFMutation = () => {
	const { t } = useTranslation();
	const chatopsUsername = useSetting('Chatops_Username');
	const formatDateAndTime = useFormatDateAndTime();

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
									<Text key={message._id} style={{ marginBottom: 5 }}>
										<Text style={{ color: '#555', fontSize: 14 }}>{message.u.username}</Text>{' '}
										<Text style={{ color: '#aaa', fontSize: 12 }}>{dateTime}</Text>
										<Text>{'\n'}</Text>
										{parseMessage(message)}
									</Text>
								);
							})}
						</View>
					</Page>
				</Document>
			);

			const instance = pdf();

			const callback = async () => {
				const link = document.createElement('a');
				link.href = URL.createObjectURL(await instance.toBlob());
				link.download = `exportedMessages-${new Date().toISOString()}.pdf`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(link.href);
			};

			try {
				instance.on('change', callback);
				instance.updateContainer(jsx);
			} finally {
				instance.removeListener('change', callback);
			}
		},
	});
};

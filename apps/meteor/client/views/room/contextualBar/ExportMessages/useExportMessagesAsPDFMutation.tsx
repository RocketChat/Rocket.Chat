import { Document, Font, Image, Page, pdf, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { IMessage, MessageAttachmentDefault } from '@rocket.chat/core-typings';
import { MessageTypes } from '@rocket.chat/message-types';
import { escapeHTML } from '@rocket.chat/tools';
import { useSetting, useToastMessageDispatch, useAbsoluteUrl } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import { Messages } from '../../../../stores';

const leftTab = {
	marginLeft: 20,
};
const NOTO_SANS_FONTS: { name: string; fontSrc: string }[] = [
	{ name: 'Noto Sans Hebrew', fontSrc: '/fonts/NotoSansHebrew-Regular.ttf' },
	{ name: 'Noto Sans', fontSrc: '/fonts/NotoSans-Regular.ttf' },
	{ name: 'Noto Sans Arabic', fontSrc: '/fonts/NotoSansArabic-Regular.ttf' },
	{ name: 'Noto Sans Devanagari', fontSrc: '/fonts/NotoSansDevanagari-Regular.ttf' },
	{ name: 'Noto Sans Bengali', fontSrc: '/fonts/NotoSansBengali-Regular.ttf' },
	{ name: 'Noto Sans Tamil', fontSrc: '/fonts/NotoSansTamil-Regular.ttf' },
	{ name: 'Noto Sans Sinhala', fontSrc: '/fonts/NotoSansSinhala-Regular.ttf' },
	{ name: 'Noto Sans Thai', fontSrc: '/fonts/NotoSansThai-Regular.ttf' },
	{ name: 'Noto Sans Lao', fontSrc: '/fonts/NotoSansLao-Regular.ttf' },
	{ name: 'Noto Sans Georgian', fontSrc: '/fonts/NotoSansGeorgian-Regular.ttf' },
	{ name: 'Noto Sans JP', fontSrc: '/fonts/NotoSansJP-Regular.ttf' },
	{ name: 'Noto Sans KR', fontSrc: '/fonts/NotoSansKR-Regular.ttf' },
	{ name: 'Noto Sans SC', fontSrc: '/fonts/NotoSansSC-Regular.ttf' },
	{ name: 'Noto Sans TC', fontSrc: '/fonts/NotoSansTC-Regular.ttf' },
	{ name: 'Noto Sans HK', fontSrc: '/fonts/NotoSansHK-Regular.ttf' },
];

const EMOJI_RENDER_SIZE = 72;

const renderEmojiToDataURL = (codePoints: string): string => {
	const points = codePoints.split('-').map((codePoint) => parseInt(codePoint, 16));
	if (points.some((point) => !Number.isInteger(point) || point < 0 || point > 0x10ffff)) {
		return '';
	}

	const emoji = String.fromCodePoint(...points);

	const canvas = document.createElement('canvas');
	canvas.width = EMOJI_RENDER_SIZE;
	canvas.height = EMOJI_RENDER_SIZE;

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		return '';
	}

	ctx.textBaseline = 'middle';
	ctx.textAlign = 'center';
	ctx.font = `${Math.floor(EMOJI_RENDER_SIZE * 0.8)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Noto Emoji", sans-serif`;
	ctx.fillText(emoji, EMOJI_RENDER_SIZE / 2, EMOJI_RENDER_SIZE / 2);

	return canvas.toDataURL('image/png');
};

const pdfStyles = StyleSheet.create({
	page: {
		fontFamily: NOTO_SANS_FONTS.map((font) => font.name),
	},
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
	const absoluteUrl = useAbsoluteUrl();

	useEffect(() => {
		for (const font of NOTO_SANS_FONTS) {
			Font.register({
				family: font.name,
				fonts: [{ src: absoluteUrl(font.fontSrc) }],
			});
		}
		// Manually build the emoji data to avoid relying on a cdn
		// https://react-pdf.org/fonts#registeremojisource
		Font.registerEmojiSource({
			withVariationSelectors: true,
			builder: renderEmojiToDataURL,
		});
	}, []);

	return useMutation({
		mutationFn: async (messageIds: IMessage['_id'][]) => {
			const parseMessage = (msg: IMessage) => {
				const messageType = MessageTypes.getType(msg);
				if (messageType) {
					return messageType.text(t, msg);
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
						<View style={{ ...pdfStyles.page, margin: 10 }}>
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

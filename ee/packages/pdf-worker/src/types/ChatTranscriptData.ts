import type { Serialized, IOmnichannelSystemMessage, ILivechatAgent, ILivechatVisitor } from '@rocket.chat/core-typings';
import type { Root } from '@rocket.chat/message-parser';
import type { i18n } from 'i18next';

export type PDFFile = { name?: string; buffer?: Buffer | null; extension?: string };

export type PDFQuote = { md: Root; name: string; ts: string };

export type PDFMessage = Serialized<
	Pick<
		IOmnichannelSystemMessage,
		'msg' | 'u' | 'ts' | 'md' | 't' | 'navigation' | 'transferData' | 'requestData' | 'webRtcCallEndTs' | 'comment'
	>
> & {
	files?: PDFFile[];
	quotes?: PDFQuote[];
	divider?: string;
};

export type ChatTranscriptData = {
	header: {
		agent: Pick<ILivechatAgent, 'name' | 'username'> | null;
		visitor: Pick<ILivechatVisitor, 'name' | 'username'> | null;
		siteName: string;
		date: string;
		time: string;
	};
	messages: PDFMessage[];
	i18n: i18n;
};

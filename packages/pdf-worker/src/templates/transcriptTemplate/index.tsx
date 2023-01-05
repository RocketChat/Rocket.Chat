import type { ILivechatAgent, ILivechatVisitor, IMessage, Serialized } from '@rocket.chat/core-typings';
import ReactPDF, { Font } from '@react-pdf/renderer';

import { OmnichannelTranscript } from './components/OmnichannelTranscript';

export type PDFMessage = Serialized<Omit<Pick<IMessage, 'msg' | 'u' | 'ts'>, 'files'>> & {
	files?: { name?: string; buffer: Buffer | null }[];
} & { divider?: string };

export type OmnichannelData = {
	header: {
		agent: ILivechatAgent;
		visitor: ILivechatVisitor;
		siteName: string;
		date: Date;
		time: Date;
	};
	dateFormat: string;
	timeAndDateFormat: string;
	body: PDFMessage[];
};

export const isOmnichannelData = (data: any): data is OmnichannelData => {
	return (
		'header' in data &&
		'body' in data &&
		'agent' in data.header &&
		'visitor' in data.header &&
		'siteName' in data.header &&
		'date' in data.header &&
		'time' in data.header
	);
};

const FONT_PATH = `${__dirname}/../../../src/assets/fonts`;

Font.register({
	family: 'Inter',
	fonts: [
		{ src: `${FONT_PATH}/inter400.ttf` },
		{ src: `${FONT_PATH}/inter500.ttf`, fontWeight: 500 },
		{ src: `${FONT_PATH}/inter700.ttf`, fontWeight: 700 },
	],
});

export default async (data: OmnichannelData): Promise<NodeJS.ReadableStream> => {
	return ReactPDF.renderToStream(<OmnichannelTranscript {...data} />);
};

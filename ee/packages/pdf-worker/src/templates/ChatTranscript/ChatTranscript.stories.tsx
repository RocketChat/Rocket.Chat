import { Font, PDFViewer } from '@react-pdf/renderer';
import type { Meta, StoryFn } from '@storybook/react';

import type { ChatTranscriptData } from '.';
import { ChatTranscriptPDF } from '.';
import { exampleData } from './ChatTranscript.fixtures';
import { ChatTranscript } from '../../strategies/ChatTranscript';

Font.register({
	family: 'Inter',
	fonts: [
		{ src: '/inter400.ttf' },
		{ src: '/inter400-italic.ttf', fontStyle: 'italic' },
		{ src: '/inter500.ttf', fontWeight: 500 },
		{ src: '/inter500-italic.ttf', fontWeight: 500, fontStyle: 'italic' },
		{ src: '/inter700.ttf', fontWeight: 700 },
		{ src: '/inter700-italic.ttf', fontWeight: 700, fontStyle: 'italic' },
	],
});

Font.register({
	family: 'FiraCode',
	fonts: [{ src: '/fira-code700.ttf', fontWeight: 700 }],
});

Font.registerHyphenationCallback((word) => [word]);

export default {
	title: 'ChatTranscriptPDFTemplate',
	component: ChatTranscriptPDF,
} satisfies Meta<typeof ChatTranscriptPDF>;

const data = new ChatTranscript().parseTemplateData(exampleData) as unknown as ChatTranscriptData;

export const ChatTranscriptPDFTemplate: StoryFn<typeof ChatTranscriptPDF> = () => (
	<PDFViewer width='100%' height='800'>
		<ChatTranscriptPDF {...data} />
	</PDFViewer>
);

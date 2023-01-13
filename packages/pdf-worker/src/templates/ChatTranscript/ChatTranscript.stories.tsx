import { Font, PDFViewer } from '@react-pdf/renderer';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { exampleData } from './ChatTranscript.fixtures';
import { ChatTranscript } from '../../strategies/ChatTranscript';
import type { ChatTranscriptData } from '.';
import { ChatTranscriptPDF } from '.';

Font.register({
	family: 'Inter',
	fonts: [{ src: '/inter400.ttf' }, { src: '/inter500.ttf', fontWeight: 500 }, { src: '/inter700.ttf', fontWeight: 700 }],
});

Font.registerHyphenationCallback((word) => [word]);

export default {
	title: 'ChatTranscriptPDFTemplate',
	component: ChatTranscriptPDF,
} as ComponentMeta<typeof ChatTranscriptPDF>;

const data = new ChatTranscript().parseTemplateData(exampleData) as unknown as ChatTranscriptData;

export const ChatTranscriptPDFTemplate: ComponentStory<typeof ChatTranscriptPDF> = () => (
	<PDFViewer width='100%' height='800'>
		<ChatTranscriptPDF {...data} />
	</PDFViewer>
);

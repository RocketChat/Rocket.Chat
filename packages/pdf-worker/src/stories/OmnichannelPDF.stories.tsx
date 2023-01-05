import { Font, PDFViewer } from '@react-pdf/renderer';
import type { ILivechatAgent, ILivechatVisitor } from '@rocket.chat/core-typings';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { OmnichannelTranscript } from '../templates/transcriptTemplate/components/OmnichannelTranscript';

export default {
	title: 'OmnichannelPDF',
} as ComponentMeta<typeof OmnichannelTranscript>;

Font.register({
	family: 'Inter',
	fonts: [{ src: '/fonts/inter400.ttf' }, { src: '/fonts/inter500.ttf', fontWeight: 500 }, { src: '/fonts/inter700.ttf', fontWeight: 700 }],
});

export const OmnichannelPDF: ComponentStory<typeof OmnichannelTranscript> = () => (
	<PDFViewer width='100%' height='800'>
		<OmnichannelTranscript
			body={[
				{
					u: { name: 'Christian Castro', username: 'christian.castro', _id: '1' },
					ts: 'Nov 21, 2022 11:00 AM',
					msg: 'Hello, how can I help you?',
				},
				{
					u: { name: 'Juanito Verdulero De Ponce', username: 'juanito.verdulero', _id: '2' },
					ts: 'Nov 21, 2022 11:00 AM',
					msg: 'Hello, Im having issues with my credit card',
				},
			]}
			header={{
				visitor: {
					name: 'Christian Castro',
					username: 'christian.castro',
				} as ILivechatVisitor,
				agent: {
					name: 'Christian Castro',
					username: 'christian.castro',
				} as ILivechatAgent,
				siteName: 'Rocket.Chat',
				date: 'Nov 21, 2022' as unknown as Date,
				time: '10:00:00 GMT' as unknown as Date,
			}}
			dateFormat='MMM DD, YYYY'
			timeAndDateFormat='MMM DD, YYYY hh:mm A'
		/>
	</PDFViewer>
);

import type { Meta, StoryObj } from '@storybook/react';

import AttachmentBlock from './AttachmentBlock';
import AttachmentContent from './AttachmentContent';
import AttachmentRow from './AttachmentRow';
import AttachmentText from './AttachmentText';
import AttachmentTitle from './AttachmentTitle';
import CollapsibleContent from '../../collapsible/CollapsibleContent';

export default {
	component: AttachmentRow,
	parameters: {
		layout: 'padded',
	},
} satisfies Meta<typeof AttachmentRow>;

type Story = StoryObj<typeof AttachmentRow>;

export const WithTitleAndCollapse: Story = {
	render: () => (
		<AttachmentBlock>
			<AttachmentContent>
				<AttachmentRow>
					<AttachmentTitle>Quarterly report</AttachmentTitle> <CollapsibleContent />
				</AttachmentRow>
				<AttachmentText>Revenue grew 12% compared to the previous quarter.</AttachmentText>
			</AttachmentContent>
		</AttachmentBlock>
	),
};

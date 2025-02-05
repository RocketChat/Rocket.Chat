import type { Meta, StoryFn } from '@storybook/react';
import type { ComponentType } from 'react';

import {
	InfoPanel,
	InfoPanelAction,
	InfoPanelActionGroup,
	InfoPanelAvatar,
	InfoPanelField,
	InfoPanelLabel,
	InfoPanelSection,
	InfoPanelText,
	InfoPanelTitle,
} from '.';
import RetentionPolicyCallout from './RetentionPolicyCallout';
import { createFakeRoom } from '../../../tests/mocks/data';

export default {
	title: 'Info Panel/InfoPanel',
	component: InfoPanel,
	subcomponents: {
		InfoPanelAction: InfoPanelAction as ComponentType<any>,
		InfoPanelActionGroup: InfoPanelActionGroup as ComponentType<any>,
		InfoPanelAvatar: InfoPanelAvatar as ComponentType<any>,
		InfoPanelField: InfoPanelField as ComponentType<any>,
		InfoPanelLabel: InfoPanelLabel as ComponentType<any>,
		InfoPanelSection: InfoPanelSection as ComponentType<any>,
		InfoPanelText: InfoPanelText as ComponentType<any>,
		InfoPanelTitle: InfoPanelTitle as ComponentType<any>,
		RetentionPolicyCallout: RetentionPolicyCallout as ComponentType<any>,
	},
} satisfies Meta<typeof InfoPanel>;

const fakeRoom = createFakeRoom();

export const Default: StoryFn<typeof InfoPanel> = () => (
	<InfoPanel>
		<InfoPanelAvatar />
		<InfoPanelSection>
			<InfoPanelTitle title='rocketchat-frontend-team' icon='hashtag' />
		</InfoPanelSection>

		<InfoPanelSection>
			<InfoPanelField>
				<InfoPanelLabel>Description</InfoPanelLabel>
				<InfoPanelText>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit
					libero
				</InfoPanelText>
			</InfoPanelField>
			<InfoPanelField>
				<InfoPanelLabel>Announcement</InfoPanelLabel>
				<InfoPanelText>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit
					libero
				</InfoPanelText>
			</InfoPanelField>
			<InfoPanelField>
				<InfoPanelLabel>Topic</InfoPanelLabel>
				<InfoPanelText>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit
					libero
				</InfoPanelText>
			</InfoPanelField>
		</InfoPanelSection>
		<InfoPanelSection>
			<RetentionPolicyCallout room={fakeRoom} />
		</InfoPanelSection>
	</InfoPanel>
);
Default.storyName = 'InfoPanel';

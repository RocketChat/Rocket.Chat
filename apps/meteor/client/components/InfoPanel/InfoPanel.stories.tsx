import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

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
import { createFakeRoom } from '../../../tests/mocks/data';
import RetentionPolicyCallout from './RetentionPolicyCallout';

export default {
	title: 'Info Panel/InfoPanel',
	component: InfoPanel,
	subcomponents: {
		InfoPanelAction,
		InfoPanelActionGroup,
		InfoPanelAvatar,
		InfoPanelField,
		InfoPanelLabel,
		InfoPanelSection,
		InfoPanelText,
		InfoPanelTitle,
		RetentionPolicyCallout,
	},
} as ComponentMeta<typeof InfoPanel>;

const fakeRoom = createFakeRoom();

export const Default: ComponentStory<typeof InfoPanel> = () => (
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

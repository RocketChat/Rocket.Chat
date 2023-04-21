import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import InfoPanel from '.';
import RetentionPolicyCallout from './RetentionPolicyCallout';

export default {
	title: 'Info Panel/InfoPanel',
	component: InfoPanel,
	subcomponents: {
		'InfoPanel.Action': InfoPanel.Action,
		'InfoPanel.ActionGroup': InfoPanel.ActionGroup,
		'InfoPanel.Avatar': InfoPanel.Avatar,
		'InfoPanel.Field': InfoPanel.Field,
		'InfoPanel.Label': InfoPanel.Label,
		'InfoPanel.Section': InfoPanel.Section,
		'InfoPanel.Text': InfoPanel.Text,
		'InfoPanel.Title': InfoPanel.Title,
		RetentionPolicyCallout,
	},
} as ComponentMeta<typeof InfoPanel>;

export const Default: ComponentStory<typeof InfoPanel> = () => (
	<InfoPanel>
		<InfoPanel.Avatar />
		<InfoPanel.Section>
			<InfoPanel.Title title='rocketchat-frontend-team' icon={'hashtag'} />
		</InfoPanel.Section>

		<InfoPanel.Section>
			<InfoPanel.Field>
				<InfoPanel.Label>Description</InfoPanel.Label>
				<InfoPanel.Text>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit
					libero
				</InfoPanel.Text>
			</InfoPanel.Field>
			<InfoPanel.Field>
				<InfoPanel.Label>Announcement</InfoPanel.Label>
				<InfoPanel.Text>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit
					libero
				</InfoPanel.Text>
			</InfoPanel.Field>
			<InfoPanel.Field>
				<InfoPanel.Label>Topic</InfoPanel.Label>
				<InfoPanel.Text>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit
					libero
				</InfoPanel.Text>
			</InfoPanel.Field>
		</InfoPanel.Section>

		<InfoPanel.Section>
			<RetentionPolicyCallout maxAgeDefault={30} filesOnlyDefault={false} excludePinnedDefault={true} />
		</InfoPanel.Section>
	</InfoPanel>
);
Default.storyName = 'InfoPanel';

// export const Archived = () => <VerticalBar height={800}>
// 	<RoomInfo
// 		{...room}
// 		icon='lock'
// 		onClickHide={alert}
// 		onClickLeave={alert}
// 		onClickEdit={alert}
// 		onClickDelete={alert}
// 		archived
// 	/>
// </VerticalBar>;

// export const Broadcast = () => <VerticalBar height={800}>
// 	<RoomInfo
// 		{...room}
// 		icon='lock'
// 		onClickHide={alert}
// 		onClickLeave={alert}
// 		onClickEdit={alert}
// 		onClickDelete={alert}
// 		broadcast
// 	/>
// </VerticalBar>;

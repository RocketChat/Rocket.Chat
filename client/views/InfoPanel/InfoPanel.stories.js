import React from 'react';

import InfoPanel from '.';
import RetentionPolicyCallout from './RetentionPolicyCallout';

export default {
	title: 'components/InfoPanel',
	component: InfoPanel,
};

const room = {
	fname: 'rocketchat-frontend-team',
	description:
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
	announcement:
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
	topic:
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
};

export const Default = () => (
	<InfoPanel>
		<InfoPanel.Avatar />
		<InfoPanel.Section>
			<InfoPanel.Title title={room.fname} icon={'hashtag'} />
		</InfoPanel.Section>

		<InfoPanel.Section>
			<InfoPanel.Field>
				<InfoPanel.Label>Description</InfoPanel.Label>
				<InfoPanel.Text>{room.description}</InfoPanel.Text>
			</InfoPanel.Field>
			<InfoPanel.Field>
				<InfoPanel.Label>Announcement</InfoPanel.Label>
				<InfoPanel.Text>{room.announcement}</InfoPanel.Text>
			</InfoPanel.Field>
			<InfoPanel.Field>
				<InfoPanel.Label>Topic</InfoPanel.Label>
				<InfoPanel.Text>{room.topic}</InfoPanel.Text>
			</InfoPanel.Field>
		</InfoPanel.Section>

		<InfoPanel.Section>
			<RetentionPolicyCallout maxAgeDefault={30} filesOnlyDefault={false} excludePinnedDefault={true} />
		</InfoPanel.Section>
	</InfoPanel>
);

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

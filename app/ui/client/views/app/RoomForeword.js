import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Avatar, Margins, Flex, Box, Tag } from '@rocket.chat/fuselage';
import { Template } from 'meteor/templating';

import './RoomForeword.html';
import { Rooms, Users } from '../../../../models';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';


const RoomForeword = ({ room, user }) => {
	const t = useTranslation();

	if (room.t !== 'd') {
		return t('Start_of_conversation');
	}

	const users = room.usernames.filter((username) => username !== user.username);
	if (users.length < 1) {
		return null;
	}

	return <Avatar.Context.Provider value={{ baseUrl: '/avatar/' }}>
		<Flex.Container justifyContent='center' direction='column'>
			<Flex.Item grow={1}>
				<Box is='div'>
					<Flex.Item grow={1}>
						<Margins block='x24'>
							<Avatar.Stack>
								{users.map((username, index) => <Avatar size='x48' title={username} url={username} key={index} data-username={username} />)}
							</Avatar.Stack>
						</Margins>
					</Flex.Item>
					<Flex.Item grow={1}>
						<Box textColor='default' textStyle='headline' >
							{ t('Direct_message_you_have_joined') }
						</Box>
					</Flex.Item>
					<Flex.Item grow={1}>
						<Margins block='x8'>
							<Box is='div'>
								{users.map((username, index) => <Margins inline='x4' key={index}><Tag textStyle='p2' is='a' href={ `/direct/${ username }` } data-username={username} className='mention-link mention-link--user'>{username}</Tag></Margins>)}
							</Box>
						</Margins>
					</Flex.Item>
				</Box>
			</Flex.Item>
		</Flex.Container>
	</Avatar.Context.Provider>;
};

Template.RoomForeword.onRendered(async function() {
	const { MeteorProvider } = await import('../../../../../client/providers/MeteorProvider');
	const ReactDOM = await import('react-dom');
	this.container = this.firstNode;
	this.autorun(() => {
		const data = Template.currentData();
		const { _id: rid } = data;

		const user = Users.findOne(Meteor.userId(), { username: 1 });

		const room = Rooms.findOne({ _id: rid });
		ReactDOM.render(React.createElement(MeteorProvider, {
			children: React.createElement(RoomForeword, { ...data, room, user }),
		}), this.container);
	});
});


Template.RoomForeword.onDestroyed(async function() {
	const ReactDOM = await import('react-dom');
	this.container && ReactDOM.unmountComponentAtNode(this.container);
});

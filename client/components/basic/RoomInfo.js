import React from 'react';
import { Box, Margins, Icon, Button, ButtonGroup, Divider } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

import RoomAvatar from './avatar/RoomAvatar';
import { useTranslation } from '../../contexts/TranslationContext';
import UserCard from './UserCard';
import VerticalBar from './VerticalBar';

const wordBreak = css`
	word-break: break-word;
`;

const Label = (props) => <Box fontScale='p2' color='default' {...props} />;
const Info = ({ className, ...props }) => <UserCard.Info className={[className, wordBreak]} flexShrink={0} {...props}/>;

const RoomInfoFooter = () => (
	<Box p='x24'>
		<Margins block='x12'>
			<ButtonGroup stretch>
				<Button><Box is='span' mie='x4'><Icon name='eye-off' size='x20' /></Box>Hide</Button>
				<Button danger><Box is='span' mie='x4'><Icon name='sign-out' size='x20' /></Box> Leave</Button>
			</ButtonGroup>

			<Divider />

			<ButtonGroup stretch>
				<Button><Box is='span' mie='x4'><Icon name='edit' size='x20' /></Box>Edit</Button>
				<Button danger><Box is='span' mie='x4'><Icon name='trash' size='x20' /></Box> Trash</Button>
			</ButtonGroup>
		</Margins>
	</Box>
);

export const RoomTitle = ({ roomName }, props) => <Box mbs='x16' fontScale='s2' color='default' {...props}><Icon name='lock' />{roomName}</Box>;

export const RoomInfo = React.memo(function RoomInfo({
	roomName,
	description,
	announcement,
	topic,
	...props
}) {
	const t = useTranslation();

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='info-circled' />
				{t('Room_Info')}
				<VerticalBar.Close />
			</VerticalBar.Header>

			<VerticalBar.ScrollableContent p='x24' {...props}>
				<Margins block='x4'>
					<Box pbe='x16'>
						<RoomAvatar />
						<RoomTitle roomName={roomName} />
					</Box>

					{description && description !== '' && <Box pbe='x16'>
						<Label>{t('Description')}</Label>
						<Info>{description}</Info>
					</Box>}

					{announcement && announcement !== '' && <Box pbe='x16'>
						<Label>{t('Announcement')}</Label>
						<Info>{announcement}</Info>
					</Box>}

					{topic && topic !== '' && <Box pbe='x16'>
						<Label>{t('Topic')}</Label>
						<Info>{topic}</Info>
					</Box>}
				</Margins>
			</VerticalBar.ScrollableContent>
			<RoomInfoFooter />
		</>
	);
});

export default RoomInfo;

// import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Accordion, Box, FieldGroup } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import Message from '../messages/Message';
import UnreadAccordionHeader from './UnreadAccordionHeader';

type AccordionProps = {
	// room: ISubscription & IRoom;
	room: any;
	handleToggleRead: (rid: string) => void;
};

const UnreadAccordion: FC<AccordionProps> = ({ room, handleToggleRead }) => {
	const [isUnread, setIsUnread] = React.useState(true);

	const handleToggle = () => {
		setIsUnread(!isUnread);
		handleToggleRead(room.rid);
	};

	return (
		<Box border='1px solid' borderColor='neutral-500' borderRadius='x4' margin='x4' elevation='2' position='relative'>
			<Accordion.Item
				{...({
					style: {
						padding: '0 !important',
					},
				} as any)}
				defaultExpanded
				title={
					<>
						<UnreadAccordionHeader room={room} messagesCount={room.messages.length} isUnread={isUnread} handleToggleRead={handleToggle} />
					</>
				}
				data-qa-id={`${room.rid}-unread-messages-room`}
			>
				<Box borderRadius='x4' padding='x1' backgroundColor='neutral-400'>
					<FieldGroup>
						{room.messages.map((msg: any, msgIndex: number) => (
							<Message key={msgIndex} id={msg._id} message={msg} sequential={true} all={true} mention={false} unread={true} />
						))}
					</FieldGroup>
				</Box>
			</Accordion.Item>
		</Box>
	);
};

export default memo(UnreadAccordion);

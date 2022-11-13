import { Accordion, Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, memo } from 'react';

import { IUnreadHistoryRoom } from '../../hooks/useUnreads';
import AccordionHeader from '../headers/AccordionHeader';
import MessageList from '../messages/MessageList';

type UnreadsBodyProps = {
	sortedRooms: any;
	expandedItem: any;
	activeMessages: any;
	handleRedirect: () => Promise<void>;
	handleMark: (room: IUnreadHistoryRoom) => Promise<void>;
	getMessages: (room: IUnreadHistoryRoom) => Promise<void>;
};

const UnreadsBody: FC<UnreadsBodyProps> = ({ sortedRooms, handleMark, handleRedirect, expandedItem, activeMessages, getMessages }) => {
	const t = useTranslation();
	return (
		<Box marginBlock='none' paddingBlock='none' marginInline='auto' width='full'>
			<Accordion borderBlockStyle='unset'>
				{sortedRooms?.map((room: any) => (
					<Accordion.Item
						key={`${room._id}${room.undo ? '-undo' : ''}`}
						className={`unreadsAccordionHeader${room.undo ? ' unreadsUndoItem' : ''}`}
						title={<AccordionHeader room={room} handleMark={handleMark} handleRedirect={handleRedirect} />}
						expanded={!room.undo && expandedItem === room._id}
						onToggle={(): void => {
							getMessages(room);
						}}
					>
						{!room.undo && (
							<>
								<ButtonGroup
									padding={0}
									paddingBlockEnd={20}
									display='flex'
									flexDirection='row'
									justifyContent='flex-end'
									alignItems='center'
									width='full'
								>
									<Button small onClick={(): Promise<void> => handleRedirect()} backgroundColor='transparent' borderColor='transparent'>
										<Icon name={'reply-directly'} size='x20' margin='4x' />
										<span style={{ marginLeft: '8px' }}>{t('Jump_to')}</span>
									</Button>
									<Button
										small
										onClick={(): Promise<void> => handleMark(room)}
										{...(room.undo ? { backgroundColor: 'transparent', borderStyle: 'unset' } : {})}
									>
										<Icon name={'flag'} size='x20' margin='4x' />
										<span style={{ marginLeft: '10px' }}>{room.undo ? t('Undo') : t('Mark_as_read')}</span>
									</Button>
								</ButtonGroup>
								<MessageList messages={activeMessages} rid={room.rid} />
							</>
						)}
					</Accordion.Item>
				))}
			</Accordion>
		</Box>
	);
};
export default memo(UnreadsBody);

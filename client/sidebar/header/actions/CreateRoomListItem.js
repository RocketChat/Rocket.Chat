import React from 'react';
import { Icon, Box, Flex, Margins } from '@rocket.chat/fuselage';

export default function CreateRoomListItem({ text, icon, action }) {
	return <Flex.Container>
		<Box is='li' onClick={action}>
			<Flex.Container>
				<Box is='label' className='rc-popover__label' style={{ width: '100%' }}>
					<Flex.Item grow={0}>
						<Box className='rc-popover__icon'><Icon name={icon} size={20}/></Box>
					</Flex.Item>
					<Margins inline='x8'>
						<Flex.Item grow={1}>
							<Box is='span' fontScale='p2'>{text}</Box>
						</Flex.Item>
					</Margins>
				</Box>
			</Flex.Container>
		</Box>
	</Flex.Container>;
}

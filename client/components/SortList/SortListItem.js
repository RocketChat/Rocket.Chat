import { Icon, Box, Flex, Margins } from '@rocket.chat/fuselage';
import React from 'react';

function SortListItem({ text, icon, input }) {
	return (
		<Flex.Container>
			<Box is='li'>
				<Flex.Container>
					<Box is='label' className='rc-popover__label' style={{ width: '100%' }}>
						<Flex.Item grow={0}>
							<Box className='rc-popover__icon'>
								<Icon name={icon} size={20} />
							</Box>
						</Flex.Item>
						<Margins inline='x8'>
							<Flex.Item grow={1}>
								<Box is='span' fontScale='p2' pie='x24'>
									{text}
								</Box>
							</Flex.Item>
						</Margins>
						<Flex.Item grow={0}>{input}</Flex.Item>
					</Box>
				</Flex.Container>
			</Box>
		</Flex.Container>
	);
}

export default SortListItem;

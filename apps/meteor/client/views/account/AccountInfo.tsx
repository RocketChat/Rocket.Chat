import { Box, Flex, Icon } from '@rocket.chat/fuselage';
import React from 'react';

type Props = {
	title: string;
	items: Record<string, any>[];
};

const AccountInfo = ({ title, items }: Props) => {
	return (
		<Box>
			<h4 style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', background: '#ddd', height: '50px' }}>
				<span style={{ marginLeft: '8px' }}>{title}</span>
			</h4>
			{items.length
				? items.map((item, index) => (
						<Box style={{ margin: '8px 0' }}>
							<Flex.Container key={index} alignItems='center'>
								<Box>
									<Flex.Item>
										<Icon name={item.icon} fontSize='30px' />
									</Flex.Item>
									<Flex.Item>
										<Box style={{ marginLeft: '8px' }}>{item.content}</Box>
									</Flex.Item>
								</Box>
							</Flex.Container>
						</Box>
				  ))
				: 'No items'}
		</Box>
	);
};

export default AccountInfo;

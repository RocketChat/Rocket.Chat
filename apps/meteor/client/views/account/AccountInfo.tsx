import { Box, Button, Flex, Icon } from '@rocket.chat/fuselage';
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
										{item.icon === 'credit' ? <img src='images/icons/icon-bank.png' alt='bank icon' /> : null}
										{item.icon === 'trust-score' ? <img src='images/icons/icon-speed.png' alt='trust-score icon' /> : null}
										{item.rc ? <Icon name={item.icon} fontSize='30px' /> : null}
									</Flex.Item>
									<Flex.Item>
										<Box style={{ marginLeft: '8px' }}>{item.content}</Box>
										{item.icon === 'credit' ? (
											<Button style={{ marginLeft: 'auto' }} primary>
												Top up
											</Button>
										) : null}
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

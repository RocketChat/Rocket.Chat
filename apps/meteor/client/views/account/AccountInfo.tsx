import { Box, Button, Flex, Icon } from '@rocket.chat/fuselage';
import { useCurrentRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React, { useContext } from 'react';
import { DispatchPreviousPageContext, UserPreviousPageContext } from '../../contexts/UserPreviousPageContext/GlobalState';

type Props = {
	title: string;
	items: Record<string, any>[];
};

const AccountInfo = ({ title, items }: Props) => {
	const { dispatch } = useContext(DispatchPreviousPageContext);

	const [routeName] = useCurrentRoute();
	const page = useRouteParameter('group');

	const handleChange = () => {
		dispatch({ type: 'ADD_LOCATION', payload: { location: `${routeName}/${page}` } });
		FlowRouter.go('/account/topup');
	};
	return (
		<Box>
			<h4 style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', background: '#ddd', height: '50px', marginTop: '20px' }}>
				<span style={{ marginLeft: '8px' }}>{title}</span>
			</h4>
			{items.length
				? items.map((item, index) => (
						<Box style={{ margin: '8px 0' }} key={index}>
							<Flex.Container alignItems='center'>
								<Box>
									<Flex.Item>
										{item.icon === 'credit' ? <img src='images/icons/icon-bank.png' alt='bank icon' /> : null}
										{item.icon === 'trust-score' ? <img src='images/icons/icon-speed.png' alt='trust-score icon' /> : null}
										{item.icon === 'gender' ? <img src='images/icons/icon-male.png' alt='gender icon' /> : null}
										{item.icon === 'info' ? <img src='images/icons/icon-info.png' alt='info icon' /> : null}
										{item.icon === 'credit-card' ? <img src='images/icons/icon-creditcard.png' alt='creditcard icon' /> : null}
										{item.rc ? <Icon name={item.icon} fontSize='32px' /> : null}
									</Flex.Item>
									<Flex.Item>
										<Box style={{ marginLeft: '8px' }}>{item.content}</Box>
										{item.icon === 'credit' ? (
											<Button style={{ marginLeft: 'auto' }} primary onClick={handleChange}>
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

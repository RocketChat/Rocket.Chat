import React from 'react';
import { TopBarTitle, TopBarToolBox, TopBarActions, TopBarAction, Menu, Box, Icon } from '@rocket.chat/fuselage';

type Props = {};

const TopBar = (props: Props) => {
	return (
		<TopBarToolBox>
			<TopBarTitle>RocketChat App</TopBarTitle>
			<TopBarActions>
				<TopBarAction icon='bell' />
				<Menu
					className='topBarMenu'
					options={{
						delete: {
							action: function noRefCheck() {},
							label: (
								<Box alignItems='center' color='danger' display='flex'>
									<Icon mie='x4' name='trash' size='x16' />
									Logout
								</Box>
							),
						},
						makeAdmin: {
							action: function noRefCheck() {},
							label: (
								<Box alignItems='center' display='flex'>
									<Icon mie='x4' name='key' size='x16' />
									Change Password
								</Box>
							),
						},
					}}
				>
					<Icon name='avatar' size='x30' />
				</Menu>
			</TopBarActions>
		</TopBarToolBox>
	);
};

export default TopBar;

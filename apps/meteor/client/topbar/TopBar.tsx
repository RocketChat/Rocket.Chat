import React from 'react';
import { TopBarTitle, TopBarToolBox, TopBarActions, TopBarAction } from '@rocket.chat/fuselage';

type Props = {};

const TopBar = (props: Props) => {
	return (
		<TopBarToolBox>
			<TopBarTitle>RocketChat App</TopBarTitle>
			<TopBarActions>
				<TopBarAction icon='bell' />
				<TopBarAction icon='avatar' />
			</TopBarActions>
		</TopBarToolBox>
	);
};

export default TopBar;

import React from 'react';
import { Box, ButtonGroup, Button } from '@rocket.chat/fuselage';

import ActionSpread from '../../../components/basic/ActionSpread';
import { useRoomActions } from './useRoomActions';

const renderButtons = ([, { icon: Icon, label, action }]) => (props) => <Button onClick={action} {...props}><Icon />{label}</Button>;
const renderButtonsUserCard = ([, { icon: Icon, action }]) => (props) => <Button small ghost onClick={action} {...props}><Icon mie='none' size='x16'/></Button>;
const mapOptions = ([key, { action, label, icon: Icon }]) => [
	key,
	{
		label: <><Icon />{label}</>,
		action,
	},
];

const mapFnFactory = (renderButtonsFn) => ({ actions = {}, spreadAmmount = 2 }) => {
	const entries = Object.entries(actions);

	const spreadEntries = entries.slice(0, spreadAmmount);
	const optionsEntries = entries.slice(spreadAmmount, entries.length);

	const options = optionsEntries.length && Object.fromEntries(optionsEntries.map(mapOptions));
	const buttons = spreadEntries.length && spreadEntries.map(renderButtonsFn);

	return [buttons, options];
};

const mapUserCard = mapFnFactory(renderButtonsUserCard);
const mapUserInfo = mapFnFactory(renderButtons);

const RoomActions = ({ user, isUserCard, ...props }) => {
	const menuOptions = useRoomActions(user);

	return <Box display='flex' flexDirection='row' {...props}>
		<ButtonGroup flexGrow={1} justifyContent='center' flexWrap='wrap'>
			<ActionSpread actions={menuOptions} mapSpread={isUserCard ? mapUserCard : mapUserInfo}/>
		</ButtonGroup>
	</Box>;
};

export default RoomActions;

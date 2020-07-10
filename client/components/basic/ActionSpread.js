import React, { useMemo } from 'react';
import { Button, Menu } from '@rocket.chat/fuselage';

const mapFn = ({ actions = {}, spreadAmmount = 2 }) => {
	const entries = Object.entries(actions);

	const spreadEntries = entries.slice(0, spreadAmmount);
	const optionsEntries = entries.slice(spreadAmmount, entries.length);

	const options = optionsEntries.length && Object.fromEntries(optionsEntries);
	const buttons = spreadEntries.length && spreadEntries.map(([, action]) => (props) => <Button onClick={action.action} {...props}>{action.label}</Button>);
	return [buttons, options];
};

const ActionSpread = ({ actions, mapSpread = mapFn, className }) => {
	const [spread, options] = useMemo(() => mapSpread({ actions, spreadAmmount: 2 }), [actions, mapSpread]);

	return <>
		{spread.length > 0 && spread.map((Item, index) => <Item key={index} className={className}/>)}
		{Object.keys(options).length > 0 && <Menu className={className} options={options} placement='bottom left'/>}
	</>;
};

export default ActionSpread;

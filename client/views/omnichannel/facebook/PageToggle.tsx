import { Box, Field, ToggleSwitch, BoxClassName } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { FC, useState, Dispatch } from 'react';

type OnToggleProps = {
	onToggle: (id: string, isSubscribed: boolean, setSubscribed: Dispatch<boolean>) => void;
};

type PageItem = {
	name: string;
	subscribed: boolean;
	id: string;
};

type PageToggleProps = OnToggleProps &
	PageItem & {
		className?: BoxClassName;
	};

const PageToggle: FC<PageToggleProps> = ({ name, id, subscribed, onToggle, className }) => {
	const [isSubscribed, setIsSubscribed] = useState(subscribed);
	const handleToggle = useMutableCallback(() => onToggle(id, isSubscribed, setIsSubscribed));
	return (
		<Field className={className}>
			<Box display='flex' flexDirection='row'>
				<Field.Label>{name}</Field.Label>
				<Field.Row>
					<ToggleSwitch checked={isSubscribed} onChange={handleToggle} />
				</Field.Row>
			</Box>
		</Field>
	);
};

export default PageToggle;

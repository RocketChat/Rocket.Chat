import type { Icon } from '@rocket.chat/fuselage';
import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React from 'react';

type GenericNoResultsProps = {
	icon: ComponentProps<typeof Icon>['name'];
	title: string;
	description: string;
	buttonTitle?: string;
	buttonAction?: () => void;
};

const GenericNoResults = ({ icon, title, description, buttonTitle, buttonAction }: GenericNoResultsProps) => {
	return (
		<States>
			<StatesIcon name={icon} />
			<StatesTitle>{title}</StatesTitle>
			<StatesSubtitle>{description}</StatesSubtitle>
			{buttonTitle && buttonAction && (
				<StatesActions>
					<StatesAction onClick={buttonAction}>{buttonTitle}</StatesAction>
				</StatesActions>
			)}
		</States>
	);
};

export default GenericNoResults;

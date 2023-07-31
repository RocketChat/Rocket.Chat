import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

type GenericNoResultsProps = {
	icon?: IconName;
	title?: string;
	description?: string;
	buttonTitle?: string;
	buttonAction?: () => void;
};

const GenericNoResults = ({ icon = 'magnifier', title, description, buttonTitle, buttonAction }: GenericNoResultsProps) => {
	const t = useTranslation();

	return (
		<States>
			<StatesIcon name={icon} />
			<StatesTitle>{title || t('No_results_found')}</StatesTitle>
			{description && <StatesSubtitle>{description}</StatesSubtitle>}
			{buttonTitle && buttonAction && (
				<StatesActions>
					<StatesAction onClick={buttonAction}>{buttonTitle}</StatesAction>
				</StatesActions>
			)}
		</States>
	);
};

export default GenericNoResults;

import { Box, States, StatesIcon, StatesLink, StatesTitle, StatesSubtitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

type LinkProps = { linkText: string; linkHref: string } | { linkText?: never; linkHref?: never };
type ButtonProps = { buttonTitle: string; buttonAction: () => void } | { buttonTitle?: never; buttonAction?: never };

type GenericNoResultsProps = {
	icon?: IconName;
	title?: string;
	description?: string;
	buttonTitle?: string;
} & LinkProps &
	ButtonProps;

const GenericNoResults = ({
	icon = 'magnifier',
	title,
	description,
	buttonTitle,
	buttonAction,
	linkHref,
	linkText,
}: GenericNoResultsProps) => {
	const t = useTranslation();

	return (
		<Box display='flex' height='100%' flexDirection='column' justifyContent='center'>
			<States>
				<StatesIcon name={icon} />
				<StatesTitle>{title || t('No_results_found')}</StatesTitle>
				{description && <StatesSubtitle>{description}</StatesSubtitle>}
				{buttonTitle && buttonAction && (
					<StatesActions>
						<StatesAction onClick={buttonAction}>{buttonTitle}</StatesAction>
					</StatesActions>
				)}
				{linkText && linkHref && (
					<StatesLink href={linkHref} target='_blank'>
						{linkText}
					</StatesLink>
				)}
			</States>
		</Box>
	);
};

export default GenericNoResults;

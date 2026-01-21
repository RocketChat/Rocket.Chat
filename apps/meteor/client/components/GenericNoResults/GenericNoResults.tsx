import { Box, States, StatesIcon, StatesLink, StatesTitle, StatesSubtitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactElement } from 'react';
import { isValidElement } from 'react';
import { useTranslation } from 'react-i18next';

type LinkProps = { linkText: string; linkHref: string } | { linkText?: never; linkHref?: never };
type ButtonProps = { buttonTitle: string; buttonAction: () => void } | { buttonTitle?: never; buttonAction?: never };

type GenericNoResultsProps = {
	icon?: IconName | ReactElement | null;
	title?: string;
	description?: string;
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
	const { t } = useTranslation();

	return (
		<Box display='flex' height='100%' flexDirection='column' justifyContent='center'>
			<States>
				{icon &&
					(typeof icon === 'string' ? (
						<StatesIcon name={icon} />
					) : (
						isValidElement(icon) && (
							<Box display='flex' justifyContent='center' pb={8}>
								{icon}
							</Box>
						)
					))}
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

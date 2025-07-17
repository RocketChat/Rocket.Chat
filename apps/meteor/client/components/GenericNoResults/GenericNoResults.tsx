import { Box, States, StatesIcon, StatesLink, StatesTitle, StatesSubtitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { useTranslation } from 'react-i18next';

type LinkProps = { linkText: string; linkHref: string } | { linkText?: never; linkHref?: never };
type ButtonProps = { buttonTitle: string; buttonAction: () => void } | { buttonTitle?: never; buttonAction?: never };

type GenericNoResultsProps = {
	icon?: IconName;
	title?: string;
	description?: string;
	buttonPrimary?: boolean;
} & LinkProps &
	ButtonProps;

const GenericNoResults = ({
	icon = 'magnifier',
	title,
	description,
	buttonTitle,
	buttonAction,
	buttonPrimary = true,
	linkHref,
	linkText,
}: GenericNoResultsProps) => {
	const { t } = useTranslation();

	return (
		<Box display='flex' height='100%' flexDirection='column' justifyContent='center'>
			<States>
				<StatesIcon name={icon} />
				<StatesTitle>{title || t('No_results_found')}</StatesTitle>
				{description && <StatesSubtitle>{description}</StatesSubtitle>}
				{buttonTitle && buttonAction && (
					<StatesActions>
						<StatesAction primary={buttonPrimary} onClick={buttonAction}>
							{buttonTitle}
						</StatesAction>
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

import { Box, States, StatesIcon, StatesTitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { useTranslation } from 'react-i18next';

import CopyErrorReportAction from '../ErrorReport/CopyErrorReportAction';
import type { CopyErrorReportActionProps } from '../ErrorReport/CopyErrorReportAction';

export type GenericErrorProps = {
	icon?: IconName;
	title?: string;
	buttonTitle?: string;
	buttonAction?: () => void;
	errorReport?: CopyErrorReportActionProps;
};

const GenericError = ({ icon = 'magnifier', title, buttonTitle, buttonAction, errorReport }: GenericErrorProps) => {
	const { t } = useTranslation();

	return (
		<Box display='flex' height='100%' flexDirection='column' justifyContent='center'>
			<States>
				<StatesIcon name={icon} variation='danger' />
				<StatesTitle>{title || t('Something_went_wrong')}</StatesTitle>
				{(buttonAction || errorReport) && (
					<StatesActions>
						{errorReport && <CopyErrorReportAction {...errorReport} />}
						{buttonAction && <StatesAction onClick={buttonAction}>{buttonTitle || t('Reload_page')}</StatesAction>}
					</StatesActions>
				)}
			</States>
		</Box>
	);
};

export default GenericError;

import { Box, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

type NotFoundProps = {
	title: string;
	subtitle: string;
};

const NotFoundState = ({ title, subtitle }: NotFoundProps): ReactElement => {
	const { t } = useTranslation();
	const router = useRouter();

	const handleGoHomeClick = () => {
		router.navigate('/home');
	};

	return (
		<Box display='flex' justifyContent='center' height='full'>
			<States>
				<StatesIcon name='magnifier' />
				<StatesTitle>{title}</StatesTitle>
				<StatesSubtitle>{subtitle}</StatesSubtitle>
				<Box mbs={16}>
					<StatesActions>
						<StatesAction onClick={handleGoHomeClick}>{t('Homepage')}</StatesAction>
					</StatesActions>
				</Box>
			</States>
		</Box>
	);
};

export default NotFoundState;

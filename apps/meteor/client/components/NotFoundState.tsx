import { Box, States, StatesAction, StatesActions, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

type NotFoundProps = {
	title?: string;
	subtitle?: string;
};

const NotFoundState = ({ title, subtitle }: NotFoundProps): ReactElement => {
	const { t } = useTranslation();
	const router = useRouter();

	const displayTitle = title || '404';
	const displaySubtitle = subtitle || "The page you're looking for doesn't exist or has been moved.";

	const handleGoHomeClick = () => {
		router.navigate('/home');
	};

	// const handleGoBackClick = () => {
	// 	router.navigate(-1);
	// };

	return (
		<Box style={{ marginBlockStart: '2rem' }} display='flex' justifyContent='center' alignItems='center' height='100vh' bg='neutral-100'>
			<States>
				<div
					style={{
						fontSize: '7.5rem',
						fontWeight: 700,
						lineHeight: 1,
						marginBottom: '1.5rem',
						color: '#6c757d',
					}}
				>
					404
				</div>
				<StatesTitle
					style={{
						fontSize: '1.9rem',
						marginBottom: '1rem',
						color: '#2F343D',
					}}
				>
					{displayTitle}
				</StatesTitle>
				<StatesSubtitle
					style={{
						fontSize: '1.2rem',
						marginBottom: '3rem',
						color: '#6c757d',
					}}
				>
					{displaySubtitle}
				</StatesSubtitle>
				<Box mbs={26}>
					<StatesActions>
						{/* <StatesAction
							// bg='neutral-100'
							// color={blue}
							style={{
								// color: 'blue',
								// bg: 'white',
								width: '100%',
								maxWidth: '10rem', // Adjust as needed
							}}
							onClick={handleGoBackClick}
						>
							{t('Back')}
						</StatesAction> */}
						<StatesAction
							// style={{
							// 	width: '100%',
							// 	maxWidth: '10rem', // Adjust as needed
							// }}
							onClick={handleGoHomeClick}
						>
							{t('Homepage')}
						</StatesAction>
					</StatesActions>
				</Box>
			</States>
		</Box>
	);
};

export default NotFoundState;

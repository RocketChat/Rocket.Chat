import { Box, Button, ButtonGroup, Flex, Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { useRoute } from '../../contexts/RouterContext';
import { useWipeInitialPageLoading } from '../../hooks/useWipeInitialPageLoading';
import { ConnectionStatusAlert } from '../connectionStatus/ConnectionStatusAlert';
import { useTranslation } from '../../contexts/TranslationContext';
import './PageNotFound.css';

export function PageNotFound() {
	useWipeInitialPageLoading();

	const t = useTranslation();
	const goToHome = useRoute('home');

	const handleGoToPreviousPageClick = () => {
		window.history.back();
	};

	const handleGoHomeClick = () => {
		goToHome();
	};

	return <>
		<ConnectionStatusAlert />
		<Flex.Container direction='column' justifyContent='center' alignItems='center'>
			<Box is='section' componentClassName='PageNotFound'>
				<Flex.Item>
					<Box>
						<Margins all='x12'>
							<Box componentClassName='PageNotFound__404' textColor='alternative'>404</Box>

							<Box textStyle='h1' textColor='alternative'>
								{t('Oops_page_not_found')}
							</Box>

							<Box textStyle='p1' textColor='alternative'>
								{t('Sorry_page_you_requested_does_not_exist_or_was_deleted')}
							</Box>
						</Margins>

						<Margins all='x32'>
							<ButtonGroup align='center'>
								<Button type='button' primary onClick={handleGoToPreviousPageClick}>{t('Return_to_previous_page')}</Button>
								<Button type='button' primary onClick={handleGoHomeClick}>{t('Return_to_home')}</Button>
							</ButtonGroup>
						</Margins>
					</Box>
				</Flex.Item>
			</Box>
		</Flex.Container>
	</>;
}

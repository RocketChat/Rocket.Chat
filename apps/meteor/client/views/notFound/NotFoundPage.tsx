import { Box, Button, ButtonGroup, Flex, Margins } from '@rocket.chat/fuselage';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

const NotFoundPage = (): ReactElement => {
	const t = useTranslation();
	const homeRoute = useRoute('home');

	const handleGoToPreviousPageClick = (): void => {
		window.history.back();
	};

	const handleGoHomeClick = (): void => {
		homeRoute.push();
	};

	return (
		<Flex.Container direction='column' justifyContent='center' alignItems='center'>
			<Box
				is='section'
				width='full'
				minHeight='sh'
				textAlign='center'
				backgroundColor='neutral-800'
				style={{
					backgroundImage: "url('/images/404.svg')",
					backgroundRepeat: 'no-repeat',
					backgroundPosition: 'center',
					backgroundSize: 'cover',
				}}
			>
				<Flex.Item>
					<Box>
						<Margins all='x12'>
							<Box fontWeight='p2m' fontSize='x64' color='alternative'>
								404
							</Box>

							<Box role='heading' aria-level={1} fontScale='h2' color='alternative'>
								{t('Oops_page_not_found')}
							</Box>

							<Box role='status' aria-label='Sorry_page_you_requested_does_not_exist_or_was_deleted' fontScale='p2' color='alternative'>
								{t('Sorry_page_you_requested_does_not_exist_or_was_deleted')}
							</Box>
						</Margins>

						<ButtonGroup align='center' margin='x64'>
							<Button type='button' primary onClick={handleGoToPreviousPageClick}>
								{t('Return_to_previous_page')}
							</Button>
							<Button type='button' primary onClick={handleGoHomeClick}>
								{t('Return_to_home')}
							</Button>
						</ButtonGroup>
					</Box>
				</Flex.Item>
			</Box>
		</Flex.Container>
	);
};

export default NotFoundPage;

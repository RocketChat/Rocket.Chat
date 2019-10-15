import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { useWipeInitialPageLoading } from '../../hooks/useWipeInitialPageLoading';
import { ConnectionStatusAlert } from '../connectionStatus/ConnectionStatusAlert';
import { useRoute } from '../contexts/RouterContext';

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
		<section className='PageNotFound'>
			<span className='PageNotFound__404'>404</span>
			<span className='PageNotFound__message'>{t('Oops_page_not_found')}</span>
			<span className='PageNotFound__description'>{t('Sorry_page_you_requested_does_not_exist_or_was_deleted')}</span>

			<div className='PageNotFound__actions'>
				<ButtonGroup>
					<Button type='button' primary onClick={handleGoToPreviousPageClick}>{t('Return_to_previous_page')}</Button>
					<Button type='button' primary onClick={handleGoHomeClick}>{t('Return_to_home')}</Button>
				</ButtonGroup>
			</div>
		</section>
	</>;
}

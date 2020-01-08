import React from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

export function NotAuthorizedPage() {
	const t = useTranslation();

	return <section className='page-container page-static page-settings'>
		<div className='content'>
			<p>{t('You_are_not_authorized_to_view_this_page')}</p>
		</div>
	</section>;
}

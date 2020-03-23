import { Paragraph } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { Page } from '../../basic/Page';

export function NotAuthorizedPage() {
	const t = useTranslation();

	return <Page>
		<Page.Content>
			<Paragraph>{t('You_are_not_authorized_to_view_this_page')}</Paragraph>
		</Page.Content>
	</Page>;
}

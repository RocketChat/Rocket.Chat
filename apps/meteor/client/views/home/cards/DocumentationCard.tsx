import { Button } from '@rocket.chat/fuselage';
import { Card, CardBody, CardFooter, CardFooterWrapper, CardTitle } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useExternalLink } from '../../../hooks/useExternalLink';

const DOCS_URL = 'https://go.rocket.chat/i/hp-documentation';

const DocumentationCard = (): ReactElement => {
	const t = useTranslation();
	const handleOpenLink = useExternalLink();

	return (
		<Card data-qa-id='homepage-documentation-card'>
			<CardTitle>{t('Documentation')}</CardTitle>
			<CardBody>{t('Learn_how_to_unlock_the_myriad_possibilities_of_rocket_chat')}</CardBody>
			<CardFooterWrapper>
				<CardFooter>
					<Button onClick={() => handleOpenLink(DOCS_URL)}>{t('See_documentation')}</Button>
				</CardFooter>
			</CardFooterWrapper>
		</Card>
	);
};

export default DocumentationCard;

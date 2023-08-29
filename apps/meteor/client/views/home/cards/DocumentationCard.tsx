import { Button } from '@rocket.chat/fuselage';
import { Card } from '@rocket.chat/ui-client';
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
			<Card.Title>{t('Documentation')}</Card.Title>
			<Card.Body>{t('Learn_how_to_unlock_the_myriad_possibilities_of_rocket_chat')}</Card.Body>
			<Card.FooterWrapper>
				<Card.Footer>
					<Button onClick={() => handleOpenLink(DOCS_URL)}>{t('See_documentation')}</Button>
				</Card.Footer>
			</Card.FooterWrapper>
		</Card>
	);
};

export default DocumentationCard;

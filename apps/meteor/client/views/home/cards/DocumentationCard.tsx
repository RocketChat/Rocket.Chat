import { Button } from '@rocket.chat/fuselage';
import { ExternalLink, Card } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

const DOCS_URL = 'https://go.rocket.chat/i/hp-documentation';

const DocumentationCard = (): ReactElement => {
	const t = useTranslation();

	return (
		<Card variant='light' data-qa-id='homepage-documentation-card'>
			<Card.Title>{t('Documentation')}</Card.Title>
			<Card.Body>{t('Learn_how_to_unlock_the_myriad_possibilities_of_rocket_chat')}</Card.Body>
			<Card.FooterWrapper>
				<Card.Footer>
					<ExternalLink to={DOCS_URL}>
						<Button>{t('See_documentation')}</Button>
					</ExternalLink>
				</Card.Footer>
			</Card.FooterWrapper>
		</Card>
	);
};

export default DocumentationCard;

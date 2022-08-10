import { Button } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import CardBody from '../../../components/Card/Body';
import Card from '../../../components/Card/Card';
import CardFooterWrapper from '../../../components/Card/CardFooterWrapper';
import CardFooter from '../../../components/Card/Footer';
import CardTitle from '../../../components/Card/Title';

const DOCS_URL = 'https://go.rocket.chat/i/hp-documentation';

const DocumentationCard = (): ReactElement => {
	const t = useTranslation();

	return (
		<Card variant='light' data-qa-id='homepage-documentation-card'>
			<CardTitle>{t('Documentation')}</CardTitle>

			<CardBody>{t('Learn_how_to_unlock_the_myriad_possibilities_of_rocket_chat')}</CardBody>

			<CardFooterWrapper>
				<CardFooter>
					<ExternalLink to={DOCS_URL}>
						<Button>{t('See_documentation')}</Button>
					</ExternalLink>
				</CardFooter>
			</CardFooterWrapper>
		</Card>
	);
};

export default DocumentationCard;

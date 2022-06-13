import { Button } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import CardBody from '../../../components/Card/Body';
import Card from '../../../components/Card/Card';
import CardFooterWrapper from '../../../components/Card/CardFooterWrapper';
import CardFooter from '../../../components/Card/Footer';
import CardTitle from '../../../components/Card/Title';
import ExternalLink from '../../../components/ExternalLink';

const DOCS_URL = 'https://google.com';

// Mobile Apps card for homepage
const DocumentationCard = (): ReactElement => {
	const t = useTranslation();

	return (
		<Card variant='light'>
			<CardTitle>{t('Homepage_card_docs_title')}</CardTitle>

			<CardBody>{t('Homepage_card_docs_description')}</CardBody>

			<CardFooterWrapper>
				<CardFooter>
					<ExternalLink to={DOCS_URL}>
						<Button>{t('Homepage_card_docs_action_button')}</Button>
					</ExternalLink>
				</CardFooter>
			</CardFooterWrapper>
		</Card>
	);
};

export default DocumentationCard;

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

const DocumentationCard = (): ReactElement => {
	const t = useTranslation();

	return (
		<Card variant='light'>
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

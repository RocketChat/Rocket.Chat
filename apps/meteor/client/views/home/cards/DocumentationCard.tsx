import type { Card } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { GenericCard, GenericCardButton } from '../../../components/GenericCard';
import { useExternalLink } from '../../../hooks/useExternalLink';

const DOCS_URL = 'https://go.rocket.chat/i/hp-documentation';

const DocumentationCard = (props: Omit<ComponentProps<typeof Card>, 'type'>): ReactElement => {
	const { t } = useTranslation();
	const handleOpenLink = useExternalLink();

	return (
		<GenericCard
			title={t('Documentation')}
			body={t('Learn_how_to_unlock_the_myriad_possibilities_of_rocket_chat')}
			buttons={[<GenericCardButton key={1} onClick={() => handleOpenLink(DOCS_URL)} children={t('See_documentation')} role='link' />]}
			data-qa-id='homepage-documentation-card'
			width='x340'
			{...props}
		/>
	);
};

export default DocumentationCard;

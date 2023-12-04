import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import GenericCard from '../../../components/GenericCard';
import { useExternalLink } from '../../../hooks/useExternalLink';

const DOCS_URL = 'https://go.rocket.chat/i/hp-documentation';

const DocumentationCard = (): ReactElement => {
	const t = useTranslation();
	const handleOpenLink = useExternalLink();

	return (
		<GenericCard
			title={t('Documentation')}
			body={t('Learn_how_to_unlock_the_myriad_possibilities_of_rocket_chat')}
			controls={[{ onClick: () => handleOpenLink(DOCS_URL), label: t('See_documentation') }]}
			data-qa-id='homepage-documentation-card'
		/>
	);
};

export default DocumentationCard;

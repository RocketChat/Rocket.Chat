import { ExternalLink } from '@rocket.chat/ui-client';
import React from 'react';

import { normalizeUrl } from './normalizeUrl';

type NormalizedLinkProps = {
	href: string;
};

const NormalizedLink = ({ href }: NormalizedLinkProps) => {
	const normalized = normalizeUrl(href);

	if (!normalized) {
		return <>{href}</>;
	}

	return <ExternalLink to={normalized}>{href}</ExternalLink>;
};

export default NormalizedLink;

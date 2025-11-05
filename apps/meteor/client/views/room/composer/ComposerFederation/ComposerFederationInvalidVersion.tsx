import { ExternalLink } from '@rocket.chat/ui-client';
import { MessageFooterCallout, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import type { ReactElement } from 'react';
import { Trans } from 'react-i18next';

import { links } from '../../../../lib/links';

const ComposerFederationInvalidVersion = (): ReactElement => {
	return (
		<MessageFooterCallout>
			<MessageFooterCalloutContent>
				<Trans
					i18nKey='Federation_Matrix_Federated_Description_invalid_version'
					components={{
						1: <ExternalLink to={links.go.matrixFederation} />,
					}}
				/>
			</MessageFooterCalloutContent>
		</MessageFooterCallout>
	);
};

export default ComposerFederationInvalidVersion;

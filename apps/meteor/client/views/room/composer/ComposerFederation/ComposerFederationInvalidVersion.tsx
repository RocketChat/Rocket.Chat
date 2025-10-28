import { ExternalLink } from '@rocket.chat/ui-client';
import { MessageFooterCallout, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import type { ReactElement } from 'react';
import { Trans } from 'react-i18next';

const ComposerFederationInvalidVersion = (): ReactElement => {
	return (
		<MessageFooterCallout>
			<MessageFooterCalloutContent>
				<Trans
					i18nKey='Federation_Matrix_Federated_Description_invalid_version'
					components={{
						1: <ExternalLink to='https://go.rocket.chat/i/matrix-federation' />,
					}}
				/>
			</MessageFooterCalloutContent>
		</MessageFooterCallout>
	);
};

export default ComposerFederationInvalidVersion;

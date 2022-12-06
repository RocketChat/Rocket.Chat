import { MessageGenericPreview } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

import MessageCollapsible from '../MessageCollapsible';
import OEmbedPreviewContent from './OEmbedPreviewContent';
import type { PreviewMetadata } from './PreviewList';

type OEmbedCollapsibleProps = { children?: ReactNode } & PreviewMetadata;

const OEmbedCollapsible = ({ children, ...props }: OEmbedCollapsibleProps): ReactElement => {
	const t = useTranslation();

	return (
		<MessageCollapsible title={t('Link_Preview')}>
			<MessageGenericPreview>
				{children}
				<OEmbedPreviewContent {...props} />
			</MessageGenericPreview>
		</MessageCollapsible>
	);
};

export default OEmbedCollapsible;

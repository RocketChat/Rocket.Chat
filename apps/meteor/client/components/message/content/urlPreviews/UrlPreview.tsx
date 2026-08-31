import { Box } from '@rocket.chat/fuselage';
import { useAttachmentAutoLoadEmbedMedia } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import type { UrlPreviewMetadata } from './UrlPreviewMetadata';
import UrlPreviewResolver from './UrlPreviewResolver';
import { useCollapse } from '../../hooks/useCollapse';
import CollapsibleContent from '../collapsible/CollapsibleContent';

const UrlPreview = (props: UrlPreviewMetadata) => {
	const autoLoadMedia = useAttachmentAutoLoadEmbedMedia();
	const [collapsed, toggleCollapse] = useCollapse(!autoLoadMedia);
	const { t } = useTranslation();

	return (
		<>
			<Box display='flex' flexDirection='row' color='hint' fontScale='c1' alignItems='center'>
				{t('Link_Preview')} <CollapsibleContent key='collapsible-content-action' collapsed={collapsed} onClick={toggleCollapse} />
			</Box>
			{!collapsed && <UrlPreviewResolver {...props} />}
		</>
	);
};

export default UrlPreview;

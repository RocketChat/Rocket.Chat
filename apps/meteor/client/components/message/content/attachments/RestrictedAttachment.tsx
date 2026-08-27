import { Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import AttachmentBlock from './structure/AttachmentBlock';
import AttachmentContent from './structure/AttachmentContent';
import AttachmentText from './structure/AttachmentText';

const RestrictedAttachment = () => {
	const t = useTranslation();

	return (
		<AttachmentBlock color="hint">
			<AttachmentContent>
				<AttachmentText>
					<Icon name="ban" size="x16" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
					{t('Attachment_Restricted', 'You can not view this attachment because you are not a member of the original room.')}
				</AttachmentText>
			</AttachmentContent>
		</AttachmentBlock>
	);
};

export default memo(RestrictedAttachment);

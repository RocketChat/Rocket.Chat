import { MessageFooterCallout } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useState } from 'react';

import { waitUntilFind } from '../../../../../../lib/utils/waitUntilFind';
import { useOmnichannelRoom, useUserIsSubscribed } from '../../../../contexts/RoomContext';
import type { ComposerMessageProps } from '../ComposerMessage';
import ComposerMessage from '../ComposerMessage';
import { ComposerOmnichannelInquiry } from './ComposerOmnichannelInquiry';
import { ComposerOmnichannelJoin } from './ComposerOmnichannelJoin';
import { ComposerOmnichannelOnHold } from './ComposerOmnichannelOnHold';

const ComposerOmnichannel = (props: ComposerMessageProps): ReactElement => {
	const { servedBy, queuedAt, _id, open, onHold } = useOmnichannelRoom();

	const isSubscribed = useUserIsSubscribed();
	const [isInquired, setIsInquired] = useState(() => !servedBy && queuedAt);

	const t = useTranslation();

	useEffect(() => {
		const inquire = async () => {
			if (isInquired) {
				await waitUntilFind(() => isSubscribed || undefined);
			}
			setIsInquired(!servedBy && queuedAt);
		};

		inquire();
	}, [queuedAt, servedBy, _id, isInquired, open, isSubscribed]);

	if (!open) {
		return (
			<footer className='rc-message-box footer'>
				<MessageFooterCallout>{t('This_conversation_is_already_closed')}</MessageFooterCallout>
			</footer>
		);
	}

	if (onHold) {
		return <ComposerOmnichannelOnHold />;
	}

	if (isInquired) {
		return <ComposerOmnichannelInquiry />;
	}

	if (!isSubscribed) {
		return <ComposerOmnichannelJoin />;
	}

	return (
		<footer className='rc-message-box footer'>
			<ComposerMessage {...props} />
		</footer>
	);
};

export default ComposerOmnichannel;

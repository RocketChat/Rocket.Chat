import {
	Message,
	MessageBody,
	MessageContainer,
	MessageHeader,
	MessageLeftContainer,
	MessageName,
	MessageNameContainer,
	MessageStatusIndicator,
	MessageStatusIndicatorItem,
	MessageTimestamp,
} from '@rocket.chat/fuselage';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import { useFormatDateAndTime, useFormatTime, useUserDisplayName } from '@rocket.chat/ui-client';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import SearchSnippetText from './SearchSnippetText';
import { getSearchHitAuthor } from '../../../../../lib/e2eeSearch/searchHitAuthor';
import type { SearchListHit } from '../../../../../lib/e2eeSearch/serverSearchHits';
import { setMessageJumpQueryStringParameter } from '../../../../../lib/utils/setMessageJumpQueryStringParameter';
import { Messages } from '../../../../../stores';
import { useGoToThread } from '../../../hooks/useGoToThread';

type LocalMessageSearchHitProps = {
	hit: SearchListHit;
	showUserAvatar: boolean;
};

/** One hit of the local index, shown like a message: a click opens the message, in its thread for a thread reply. */
const LocalMessageSearchHit = ({ hit, showUserAvatar }: LocalMessageSearchHitProps) => {
	const { t } = useTranslation();
	const formatTime = useFormatTime();
	const formatDateAndTime = useFormatDateAndTime();
	const goToThread = useGoToThread();
	const loadedMessage = Messages.use((state) => state.get(hit.id));
	const author = getSearchHitAuthor(hit, loadedMessage);
	const displayName = useUserDisplayName({ name: author.name, username: author.username });

	const openMessage = () => {
		if (hit.tmid) {
			goToThread({ rid: hit.rid, tmid: hit.tmid, msg: hit.id });
			return;
		}
		void setMessageJumpQueryStringParameter(hit.id);
	};

	return (
		<Message
			clickable
			role='button'
			tabIndex={0}
			title={t('Jump_to_message')}
			onClick={openMessage}
			onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
				if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
				event.preventDefault();
				openMessage();
			}}
			data-qa='local-message-search-hit'
		>
			<MessageLeftContainer>
				{showUserAvatar && <MessageAvatar username={author.username} title='' size='x36' aria-hidden='true' />}
			</MessageLeftContainer>
			<MessageContainer>
				<MessageHeader>
					<MessageNameContainer>
						<MessageName title={author.username}>{displayName}</MessageName>
					</MessageNameContainer>
					<MessageTimestamp title={formatDateAndTime(hit.ts)}>{formatTime(hit.ts)}</MessageTimestamp>
					{/* The same mark as an encrypted message in the room. */}
					{hit.encrypted && (
						<MessageStatusIndicator>
							<MessageStatusIndicatorItem name='key' data-qa='local-message-search-hit-encrypted' />
						</MessageStatusIndicator>
					)}
				</MessageHeader>
				<MessageBody>
					<SearchSnippetText snippet={hit.snippet} />
				</MessageBody>
			</MessageContainer>
		</Message>
	);
};

export default LocalMessageSearchHit;

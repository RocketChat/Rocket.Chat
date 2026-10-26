import type { E2EESearchHit } from '@rocket.chat/desktop-api';
import {
	Message,
	MessageBody,
	MessageContainer,
	MessageHeader,
	MessageLeftContainer,
	MessageName,
	MessageNameContainer,
	MessageTimestamp,
} from '@rocket.chat/fuselage';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import { useFormatDateAndTime, useFormatTime, useUserDisplayName } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import SearchSnippetText from './SearchSnippetText';
import { clickableItem } from '../../../../../lib/clickableItem';
import { getSearchHitAuthor } from '../../../../../lib/e2eeSearch/searchHitAuthor';
import { setMessageJumpQueryStringParameter } from '../../../../../lib/utils/setMessageJumpQueryStringParameter';
import { Messages } from '../../../../../stores';
import { useGoToThread } from '../../../hooks/useGoToThread';

const ClickableMessage = clickableItem(Message);

type LocalMessageSearchHitProps = {
	hit: E2EESearchHit;
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
	const displayName = useUserDisplayName({ name: author?.name, username: author?.username });

	const openMessage = () => {
		if (hit.tmid) {
			goToThread({ rid: hit.rid, tmid: hit.tmid, msg: hit.id });
			return;
		}
		void setMessageJumpQueryStringParameter(hit.id);
	};

	return (
		<ClickableMessage role='button' title={t('Jump_to_message')} onClick={openMessage} data-qa='local-message-search-hit'>
			<MessageLeftContainer>
				{author && showUserAvatar && <MessageAvatar username={author.username} title='' size='x36' aria-hidden='true' />}
			</MessageLeftContainer>
			<MessageContainer>
				<MessageHeader>
					{author && (
						<MessageNameContainer>
							<MessageName title={author.username}>{displayName}</MessageName>
						</MessageNameContainer>
					)}
					<MessageTimestamp title={formatDateAndTime(hit.ts)}>{formatTime(hit.ts)}</MessageTimestamp>
				</MessageHeader>
				<MessageBody>
					<SearchSnippetText snippet={hit.snippet} />
				</MessageBody>
			</MessageContainer>
		</ClickableMessage>
	);
};

export default LocalMessageSearchHit;

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
import { useFormatDateAndTime, useFormatTime } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import SearchSnippetText from './SearchSnippetText';
import { clickableItem } from '../../clickableItem';

const ClickableMessage = clickableItem(Message);

export type LocalSearchHit = {
	id: string;
	rid: string;
	tmid?: string;
	uid: string;
	username: string;
	displayName: string;
	ts: number;
	snippet: string;
};

export type LocalMessageSearchHitProps = {
	hit: LocalSearchHit;
	showUserAvatar: boolean;
	onOpenHit: (hit: LocalSearchHit) => void;
};

const LocalMessageSearchHit = ({ hit, showUserAvatar, onOpenHit }: LocalMessageSearchHitProps) => {
	const { t } = useTranslation();
	const formatTime = useFormatTime();
	const formatDateAndTime = useFormatDateAndTime();

	return (
		<ClickableMessage role='button' title={t('Jump_to_message')} onClick={() => onOpenHit(hit)} data-qa='local-message-search-hit'>
			<MessageLeftContainer>
				{showUserAvatar && <MessageAvatar username={hit.username} title='' size='x36' aria-hidden='true' />}
			</MessageLeftContainer>
			<MessageContainer>
				<MessageHeader>
					<MessageNameContainer>
						<MessageName title={hit.username}>{hit.displayName}</MessageName>
					</MessageNameContainer>
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

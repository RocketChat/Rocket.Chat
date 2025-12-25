import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarEmptyContent,
	ContextualbarDialog,
	ContextualbarSkeleton,
} from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import MediaCallHistoryExternal, { isExternalCallHistoryItem } from './MediaCallHistoryExternal';
import MediaCallHistoryInternal, { isInternalCallHistoryItem } from './MediaCallHistoryInternal';
import { callHistoryQueryKeys } from '../../lib/queryKeys';

type MediaCallHistoryContextualbarProps = {
	openRoomId?: string;
	messageRoomId?: string;
	openUserInfo?: (userId: string, rid: string) => void;
	onClose: () => void;
	callId?: string;
	historyId?: string;
};

const MediaCallHistoryContextualbar = ({
	openRoomId,
	messageRoomId,
	openUserInfo,
	callId,
	historyId,
	onClose,
}: MediaCallHistoryContextualbarProps) => {
	const { t } = useTranslation();

	const getCallHistory = useEndpoint('GET', '/v1/call-history.info');
	const { data, isPending, isSuccess } = useQuery({
		queryKey: callHistoryQueryKeys.info(callId || historyId),
		queryFn: async () => {
			if (callId) {
				return getCallHistory({ callId } as any); // TODO fix this type
			}
			if (historyId) {
				return getCallHistory({ historyId } as any); // TODO fix this type
			}
			throw new Error('Call ID or history ID is required');
		},
		staleTime: Infinity, // Call history should never change...
		enabled: !!callId || !!historyId,
	});

	if (isPending) {
		return <ContextualbarSkeleton />;
	}

	if (isSuccess && isInternalCallHistoryItem(data)) {
		return (
			<MediaCallHistoryInternal
				onClose={onClose}
				data={data}
				openUserInfo={openUserInfo}
				openRoomId={openRoomId}
				messageRoomId={messageRoomId}
			/>
		);
	}

	if (isSuccess && isExternalCallHistoryItem(data)) {
		return <MediaCallHistoryExternal onClose={onClose} data={data} />;
	}

	return (
		<ContextualbarDialog onClose={onClose}>
			<ContextualbarHeader>
				<ContextualbarIcon name='info-circled' />
				<ContextualbarTitle>{t('Call_info')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarEmptyContent icon='warning' title={t('Call_info_could_not_be_loaded')} subtitle={t('Please_try_again')} />
		</ContextualbarDialog>
	);
};

export default MediaCallHistoryContextualbar;

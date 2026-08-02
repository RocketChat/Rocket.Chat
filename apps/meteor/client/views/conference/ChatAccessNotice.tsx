import { Box, Button } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

type ChatAccessNoticeProps = {
	callId: string;
	/** Ids of members who cannot read the chat; the notice hides itself when there are none. */
	memberIds: string[];
};

/**
 * Being added to a conference grants no room access, so some members can be in the call without being able
 * to read its chat. Rather than forcing that choice on whoever adds them, it is surfaced here once it
 * matters, with a single action — the server picks the only mechanism the room allows.
 */
const ChatAccessNotice = ({ callId, memberIds }: ChatAccessNoticeProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const shareChat = useEndpoint('POST', '/v1/video-conference.share-chat');

	// The conference's own `discussionUpdated` broadcast is what moves everyone's chat panel, so there is
	// nothing to refetch here on success.
	const { mutate, isPending } = useMutation({
		mutationFn: () => shareChat({ callId }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	if (!memberIds.length) {
		return null;
	}

	return (
		<Box
			display='flex'
			alignItems='center'
			justifyContent='space-between'
			paddingInline={12}
			paddingBlock={8}
			backgroundColor='status-background-warning'
			borderBlockEndWidth={1}
			borderBlockEndColor='stroke-extra-light'
		>
			<Box fontScale='c1' color='default' marginInlineEnd={8}>
				{t('__count__participants_cannot_see_the_chat', { count: memberIds.length })}
			</Box>
			<Button small loading={isPending} onClick={() => mutate()}>
				{t('Give_access')}
			</Button>
		</Box>
	);
};

export default ChatAccessNotice;

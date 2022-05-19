import { IMessage } from '@rocket.chat/core-typings';
import { CheckBox } from '@rocket.chat/fuselage';
import { useTranslation, useUserSubscription } from '@rocket.chat/ui-contexts';
import { Template } from 'meteor/templating';
import React, { useMemo, ReactElement, useState } from 'react';

import { normalizeThreadTitle } from '../../../../app/threads/client/lib/normalizeThreadTitle';
import VerticalBarAction from '../../../components/VerticalBar/VerticalBarAction';
import VerticalBarContent from '../../../components/VerticalBar/VerticalBarContent';
import VerticalBarText from '../../../components/VerticalBar/VerticalBarText';
import { useMemoCompare } from '../../../hooks/useMemoCompare';
import { useTabBarOpenUserInfo } from '../providers/ToolboxProvider';
import ThreadVerticalBar from './ThreadVerticalBar';
import { useBlazeTemplate } from './useBlazeTemplate';
import { useThreadFollowing } from './useThreadFollowing';

const subscriptionFields = {};

type ThreadViewProps = {
	mainMessage: IMessage;
	jumpTo: IMessage['_id'] | undefined;
	onBack: () => void;
	onClose: () => void;
};

const ThreadView = ({ mainMessage, jumpTo, onBack, onClose }: ThreadViewProps): ReactElement => {
	const title = useMemo(() => {
		const titleHTML = normalizeThreadTitle(mainMessage);

		if (!titleHTML) {
			return null;
		}

		return <VerticalBarText dangerouslySetInnerHTML={{ __html: titleHTML }} />;
	}, [mainMessage]);

	const t = useTranslation();

	const [following, toggleFollowing] = useThreadFollowing(mainMessage._id);
	const followLabel = following ? t('Following') : t('Not_Following');
	const followIcon = following ? 'bell' : 'bell-off';

	const subscription = useUserSubscription(mainMessage.rid, subscriptionFields);
	const openUserInfo = useTabBarOpenUserInfo();
	const [sendToChannel, setSendToChannel] = useState(() => !mainMessage.tcount);
	const viewData = useMemoCompare(
		{
			mainMessage,
			jump: jumpTo,
			following,
			subscription,
			rid: mainMessage.rid,
			tabBar: { openUserInfo },
		},
		(prev, next) => !next.mainMessage || prev.mainMessage?._id === next.mainMessage?._id,
	);

	const ref = useBlazeTemplate<HTMLElement>(Template.thread, {
		...viewData,
		sendToChannel,
		setSendToChannel,
	});

	return (
		<ThreadVerticalBar
			title={title}
			actions={<VerticalBarAction title={followLabel} name={followIcon} onClick={(): void => toggleFollowing()} />}
			onBack={onBack}
			onClose={onClose}
		>
			<VerticalBarContent ref={ref} flexShrink={1} flexGrow={1} paddingInline={0} />
			<footer className='thread-footer'>
				<div style={{ display: 'flex' }}>
					<CheckBox id='sendAlso' checked={sendToChannel} onChange={(): void => setSendToChannel((checked) => !checked)} />
				</div>
				<label htmlFor='sendAlso' className='thread-footer__text'>
					{t('Also_send_to_channel')}
				</label>
			</footer>
		</ThreadVerticalBar>
	);
};

export default ThreadView;

import { IMessage } from '@rocket.chat/core-typings';
import { useTranslation, useUserSubscription } from '@rocket.chat/ui-contexts';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import React, { useMemo, useEffect, useRef, ReactElement } from 'react';

import { normalizeThreadTitle } from '../../../../app/threads/client/lib/normalizeThreadTitle';
import VerticalBarAction from '../../../components/VerticalBar/VerticalBarAction';
import VerticalBarContent from '../../../components/VerticalBar/VerticalBarContent';
import VerticalBarText from '../../../components/VerticalBar/VerticalBarText';
import { useMemoCompare } from '../../../hooks/useMemoCompare';
import { useTabBarOpenUserInfo } from '../providers/ToolboxProvider';
import ThreadVerticalBar from './ThreadVerticalBar';
import { useThreadFollowing } from './useThreadFollowing';

const subscriptionFields = {};

type ThreadViewProps = {
	message: IMessage;
	jump: string | undefined;
	onBack: () => void;
	onClose: () => void;
};

const ThreadView = ({ message, jump, onBack, onClose }: ThreadViewProps): ReactElement => {
	const title = useMemo(() => {
		const titleHTML = normalizeThreadTitle(message);

		if (!titleHTML) {
			return null;
		}

		return <VerticalBarText dangerouslySetInnerHTML={{ __html: titleHTML }} />;
	}, [message]);

	const t = useTranslation();

	const [following, toggleFollowing] = useThreadFollowing(message._id);
	const followLabel = following ? t('Following') : t('Not_Following');
	const followIcon = following ? 'bell' : 'bell-off';

	const ref = useRef<HTMLElement>(null);

	const subscription = useUserSubscription(message.rid, subscriptionFields);
	const openUserInfo = useTabBarOpenUserInfo();
	const viewData = useMemoCompare(
		{
			mainMessage: message,
			jump,
			following,
			subscription,
			rid: message.rid,
			tabBar: { openUserInfo },
		},
		(prev, next) => !next.mainMessage || prev.mainMessage?._id === next.mainMessage?._id,
	);

	useEffect(() => {
		if (!ref.current) {
			return;
		}
		const view = Blaze.renderWithData(Template.thread, viewData, ref.current);

		return (): void => {
			Blaze.remove(view);
		};
	}, [viewData]);

	return (
		<ThreadVerticalBar
			title={title}
			actions={<VerticalBarAction title={followLabel} name={followIcon} onClick={(): void => toggleFollowing()} />}
			onBack={onBack}
			onClose={onClose}
		>
			<VerticalBarContent ref={ref} flexShrink={1} flexGrow={1} paddingInline={0} />
		</ThreadVerticalBar>
	);
};

export default ThreadView;

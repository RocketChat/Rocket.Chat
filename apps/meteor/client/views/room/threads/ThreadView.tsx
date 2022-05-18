import { IMessage } from '@rocket.chat/core-typings';
import { Modal, Box } from '@rocket.chat/fuselage';
import { useTranslation, useUserSubscription } from '@rocket.chat/ui-contexts';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import React, { useMemo, useEffect, useRef, ReactElement, MouseEvent } from 'react';

import { normalizeThreadTitle } from '../../../../app/threads/client/lib/normalizeThreadTitle';
import VerticalBar from '../../../components/VerticalBar';
import { useDir } from '../../../hooks/useDir';
import { useMemoCompare } from '../../../hooks/useMemoCompare';
import { useTabBarOpenUserInfo } from '../providers/ToolboxProvider';
import { useThreadFollowing } from './useThreadFollowing';

const subscriptionFields = {};

type ThreadViewProps = {
	message: IMessage;
	jump: string | undefined;
	canExpand: boolean;
	expanded: boolean;
	onToggleExpand: () => void;
	onClose: () => void;
	onClickBack: (e: MouseEvent<HTMLOrSVGElement>) => void;
};

const ThreadView = ({ message, jump, canExpand, expanded, onToggleExpand, onClose, onClickBack }: ThreadViewProps): ReactElement => {
	const title: string = useMemo(() => normalizeThreadTitle(message), [message]);

	const dir = useDir();

	const style = useMemo(
		() =>
			dir === 'rtl'
				? {
						left: 0,
						borderTopRightRadius: 4,
				  }
				: {
						right: 0,
						borderTopLeftRadius: 4,
				  },
		[dir],
	);

	const t = useTranslation();

	const expandLabel = expanded ? t('Collapse') : t('Expand');
	const expandIcon = expanded ? 'arrow-collapse' : 'arrow-expand';

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
		<>
			{canExpand && expanded && <Modal.Backdrop onClick={onClose} />}

			<Box flexGrow={1} position={expanded ? 'static' : 'relative'}>
				<VerticalBar
					className='rcx-thread-view'
					position={canExpand && expanded ? 'fixed' : 'absolute'}
					display='flex'
					flexDirection='column'
					width={'full'}
					maxWidth={canExpand && expanded ? 855 : undefined}
					overflow='hidden'
					zIndex={100}
					insetBlock={0}
					style={style} // workaround due to a RTL bug in Fuselage
				>
					<VerticalBar.Header>
						{onClickBack && <VerticalBar.Action onClick={onClickBack} title={t('Back_to_threads')} name='arrow-back' />}
						<VerticalBar.Text dangerouslySetInnerHTML={{ __html: title ?? '' }} />
						{canExpand && <VerticalBar.Action title={expandLabel} name={expandIcon} onClick={(): void => onToggleExpand()} />}
						<VerticalBar.Actions>
							<VerticalBar.Action title={followLabel} name={followIcon} onClick={(): void => toggleFollowing()} />
							<VerticalBar.Close onClick={onClose} />
						</VerticalBar.Actions>
					</VerticalBar.Header>
					<VerticalBar.Content ref={ref} flexShrink={1} flexGrow={1} paddingInline={0} />
				</VerticalBar>
			</Box>
		</>
	);
};

export default ThreadView;

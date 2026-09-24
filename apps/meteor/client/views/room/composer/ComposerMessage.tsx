import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { memo, useMemo, useSyncExternalStore } from 'react';

import ComposerCapabilitiesProvider from './ComposerCapabilitiesProvider';
import ComposerSkeleton from './ComposerSkeleton';
import { LegacyRoomManager } from '../../../lib/LegacyRoomManager';
import { useRoom } from '../contexts/RoomContext';
import { useComposerActions } from './hooks/useComposerActions';
import MessageBox from './messageBox/MessageBox';
import RichTextMessageBox from './messageBox/RichTextMessageBox';

export type ComposerMessageProps = {
	tmid?: IMessage['_id'];
	threadExists?: boolean;
	children?: ReactNode;
	subscription?: ISubscription;
	tshow?: boolean;
	previewUrls?: string[];
	onResize?: () => void;
	onEscape?: () => void;
	onSend?: () => void;
	onNavigateToNextMessage?: () => void;
	onNavigateToPreviousMessage?: () => void;
	onClickSelectAll?: () => void;
};

const ComposerMessage = ({ tmid, onSend, ...props }: ComposerMessageProps) => {
	const room = useRoom();

	const composerProps = useComposerActions({ tmid, onSend });

	const { subscribe, getSnapshotValue } = useMemo(() => {
		return LegacyRoomManager.listenRoomPropsByRid(room._id, 'streamActive');
	}, [room._id]);

	const publicationReady = useSyncExternalStore(subscribe, getSnapshotValue);

	if (!publicationReady) {
		return <ComposerSkeleton />;
	}
	return (
		<ComposerCapabilitiesProvider rid={room._id}>
			<FeaturePreview feature='realtimeMessageComposer'>
				<FeaturePreviewOff>
					<MessageBox key={tmid ? `${room._id}-${tmid}` : room._id} tmid={tmid} {...composerProps} {...props} />
				</FeaturePreviewOff>
				<FeaturePreviewOn>
					<RichTextMessageBox key={tmid ? `${room._id}-${tmid}` : room._id} tmid={tmid} {...composerProps} {...props} />
				</FeaturePreviewOn>
			</FeaturePreview>
		</ComposerCapabilitiesProvider>
	);
};

export default memo(ComposerMessage);

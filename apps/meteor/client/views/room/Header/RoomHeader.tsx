import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { Header, HeaderContent, HeaderContentRow, HeaderToolbar } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';

import FederatedRoomOriginServer from './FederatedRoomOriginServer';
import ParentRoom from './ParentRoom';
import RoomTitle from './RoomTitle';
import RoomToolbox from './RoomToolbox';
import RoomTopic from './RoomTopic';
import Encrypted from './icons/Encrypted';
import Favorite from './icons/Favorite';
import Translate from './icons/Translate';

export type RoomHeaderProps = {
	room: IRoom;
	slots?: {
		start?: ReactNode;
		preContent?: ReactNode;
		insideContent?: ReactNode;
		posContent?: ReactNode;
		end?: ReactNode;
		toolbox?: {
			pre?: ReactNode;
			content?: ReactNode;
			pos?: ReactNode;
			hidden?: boolean;
		};
	};
};

const RoomHeader = ({ room, slots = {} }: RoomHeaderProps) => {
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<Header>
			{slots?.start}
			<ParentRoom room={room} />
			{slots?.preContent}

			<HeaderContent>
				<HeaderContentRow>
					{room.t === 'd' && (
						<IconButton
							icon='arrow-back'
							small
							title={t('Back_to_workspace')}
							onClick={() => router.navigate('/home')}
						/>
					)}

					<RoomTitle room={room} />
					<Favorite room={room} />
					{isRoomFederated(room) && <FederatedRoomOriginServer room={room} />}
					<Encrypted room={room} />
					<Translate room={room} />
					<RoomTopic room={room} />
					{slots?.insideContent}
				</HeaderContentRow>
			</HeaderContent>

			{slots?.posContent}

			{slots.toolbox?.hidden !== true && (
				<Suspense fallback={null}>
					<HeaderToolbar aria-label={t('Toolbox_room_actions')}>
						{slots?.toolbox?.pre}
						{slots?.toolbox?.content || <RoomToolbox />}
						{slots?.toolbox?.pos}
					</HeaderToolbar>
				</Suspense>
			)}

			{slots?.end}
		</Header>
	);
};

export default RoomHeader;

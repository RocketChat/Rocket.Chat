import type { RoomType } from '@rocket.chat/core-typings';
import { Box, States, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import { Header } from '../../components/Header';
import { getErrorMessage } from '../../lib/errorHandling';
import { NotAuthorizedError } from '../../lib/errors/NotAuthorizedError';
import { OldUrlRoomError } from '../../lib/errors/OldUrlRoomError';
import { RoomNotFoundError } from '../../lib/errors/RoomNotFoundError';
import RoomSkeleton from './RoomSkeleton';
import RoomSidePanel from './SidePanel/RoomSidePanel';
import { useOpenRoom } from './hooks/useOpenRoom';

const RoomProvider = lazy(() => import('./providers/RoomProvider'));
const RoomNotFound = lazy(() => import('./RoomNotFound'));
const Room = lazy(() => import('./Room'));
const RoomLayout = lazy(() => import('./layout/RoomLayout'));
const NotAuthorizedPage = lazy(() => import('../notAuthorized/NotAuthorizedPage'));

type RoomOpenerProps = {
	type: RoomType;
	reference: string;
};

const isDirectMessageRoom = (type: RoomType) => type === 'd';

const RoomOpener = ({ type, reference }: RoomOpenerProps): ReactElement => {
	const { data, error, isSuccess, isError, isLoading } = useOpenRoom({ type, reference });
	const { t } = useTranslation();

	return (
		<Box display='flex' w='full' h='full'>
			<FeaturePreview feature='sidepanelNavigation'>
				<FeaturePreviewOff>{null}</FeaturePreviewOff>
				<FeaturePreviewOn>{!isDirectMessageRoom(type) && <RoomSidePanel />}</FeaturePreviewOn>
			</FeaturePreview>

			<Suspense fallback={<RoomSkeleton />}>
				{isLoading && <RoomSkeleton />}
				{isSuccess && (
					<RoomProvider rid={data.rid}>
						<Room />
					</RoomProvider>
				)}
				{isError &&
					(() => {
						if (error instanceof OldUrlRoomError) {
							return <RoomSkeleton />;
						}

						if (error instanceof RoomNotFoundError) {
							return <RoomNotFound />;
						}

						if (error instanceof NotAuthorizedError) {
							return <NotAuthorizedPage />;
						}

						return (
							<RoomLayout
								header={<Header />}
								body={
									<States>
										<StatesIcon name='circle-exclamation' variation='danger' />
										<StatesTitle>{t('core.Error')}</StatesTitle>
										<StatesSubtitle>{getErrorMessage(error)}</StatesSubtitle>
									</States>
								}
							/>
						);
					})()}
			</Suspense>
		</Box>
	);
};

export default RoomOpener;

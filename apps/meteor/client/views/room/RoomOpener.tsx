import type { RoomType } from '@rocket.chat/core-typings';
import { States, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { Header } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import { getErrorMessage } from '../../lib/errorHandling';
import { NotAuthorizedError } from '../../lib/errors/NotAuthorizedError';
import { RoomNotFoundError } from '../../lib/errors/RoomNotFoundError';
import RoomSkeleton from './RoomSkeleton';
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

const RoomOpener = ({ type, reference }: RoomOpenerProps): ReactElement => {
	const { data, error, isSuccess, isError, isLoading } = useOpenRoom({ type, reference });
	const { t } = useTranslation();

	return (
		<Suspense fallback={<RoomSkeleton />}>
			{isLoading && <RoomSkeleton />}
			{isSuccess && (
				<RoomProvider rid={data.rid}>
					<Room />
				</RoomProvider>
			)}
			{isError &&
				(() => {
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
	);
};

export default RoomOpener;

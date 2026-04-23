import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { ContextualbarDialog, Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import EditRoomWithData from './EditRoomWithData';
import RoomsTable from './RoomsTable';

const RoomsPage = (): ReactElement => {
	const { t } = useTranslation();
	const router = useRouter();
	const id = useRouteParameter('id');
	const context = useRouteParameter('context');

	const reloadRef = useRef(() => null);
	const handleCloseContextualbar = useEffectEvent(() => router.navigate('/admin/rooms'));

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Rooms')} />
				<PageContent>
					<RoomsTable reload={reloadRef} />
				</PageContent>
			</Page>
			{context && (
				<ContextualbarDialog onClose={handleCloseContextualbar}>
					<EditRoomWithData rid={id} onReload={reloadRef.current} onClose={handleCloseContextualbar} />
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default RoomsPage;

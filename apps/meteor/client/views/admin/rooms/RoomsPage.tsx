import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { ContextualbarDialog, Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import EditRoomWithData from './EditRoomWithData';
import RoomsTable from './RoomsTable';

const RoomsPage = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const id = useRouteParameter('id');
	const context = useRouteParameter('context');

	const queryClient = useQueryClient();
	const handleReload = useStableCallback(() =>
		queryClient.invalidateQueries({ queryKey: ['rooms'], predicate: ({ queryKey }) => queryKey.at(-1) === 'admin' }),
	);
	const handleCloseContextualbar = useStableCallback(() => router.navigate('/admin/rooms'));

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Rooms')} />
				<PageContent>
					<RoomsTable />
				</PageContent>
			</Page>
			{context && (
				<ContextualbarDialog onClose={handleCloseContextualbar}>
					<EditRoomWithData rid={id} onReload={handleReload} onClose={handleCloseContextualbar} />
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default RoomsPage;

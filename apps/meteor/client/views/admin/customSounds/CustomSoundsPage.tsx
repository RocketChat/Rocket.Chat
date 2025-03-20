import { Button } from '@rocket.chat/fuselage';
import { useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import AddCustomSound from './AddCustomSound';
import CustomSoundsTable from './CustomSoundsTable';
import EditCustomSound from './EditCustomSound';
import {
	ContextualbarTitle,
	Contextualbar,
	ContextualbarClose,
	ContextualbarHeader,
	ContextualbarDialog,
} from '../../../components/Contextualbar';
import { Page, PageHeader, PageContent } from '../../../components/Page';

const CustomSoundsPage = () => {
	const { t } = useTranslation();
	const id = useRouteParameter('id');
	const route = useRoute('custom-sounds');
	const context = useRouteParameter('context');

	const reload = useRef(() => null);

	const handleItemClick = useCallback(
		(_id: string) => (): void => {
			route.push({
				context: 'edit',
				id: _id,
			});
		},
		[route],
	);

	const handleNewButtonClick = useCallback(() => {
		route.push({ context: 'new' });
	}, [route]);

	const handleClose = useCallback(() => {
		route.push({});
	}, [route]);

	const handleReload = useCallback(() => {
		reload.current();
	}, []);

	return (
		<Page flexDirection='row'>
			<Page name='admin-custom-sounds'>
				<PageHeader title={t('Sounds')}>
					<Button primary onClick={handleNewButtonClick} aria-label={t('New')}>
						{t('New')}
					</Button>
				</PageHeader>
				<PageContent>
					<CustomSoundsTable reload={reload} onClick={handleItemClick} />
				</PageContent>
			</Page>
			{context && (
				<ContextualbarDialog>
					<Contextualbar>
						<ContextualbarHeader>
							<ContextualbarTitle>
								{context === 'edit' && t('Custom_Sound_Edit')}
								{context === 'new' && t('Custom_Sound_Add')}
							</ContextualbarTitle>
							<ContextualbarClose onClick={handleClose} />
						</ContextualbarHeader>
						{context === 'edit' && <EditCustomSound _id={id} close={handleClose} onChange={handleReload} />}
						{context === 'new' && <AddCustomSound goToNew={handleItemClick} close={handleClose} onChange={handleReload} />}
					</Contextualbar>
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default CustomSoundsPage;

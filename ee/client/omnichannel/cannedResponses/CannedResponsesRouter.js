import { ButtonGroup, Button, Icon, TextInput } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo, useState } from 'react';

import VerticalBar from '../../../../client/components/VerticalBar';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import CannedResponseAdd from './CannedResponseAdd';
import CannedResponseDetails from './CannedResponseDetails';
import CannedResponseEdit from './CannedResponseEdit';
import CannedResponsesList from './CannedResponsesList';
import { withData } from './withData';

const PAGES = {
	List: 'list',
	Details: 'details',
	Edit: 'edit',
	Add: 'add',
};

const useHandlePage = (page, setCurrentPage) =>
	useMutableCallback(() => {
		setCurrentPage(page);
	});

const CannedResponsesRouter = ({ responses, onClose, onSave, filter, onChangeFilter }) => {
	const [currentPage, setCurrentPage] = useState(PAGES.List);
	const [responseId, setResponseId] = useState('');
	const t = useTranslation();

	const onEdit = useHandlePage(PAGES.Edit, setCurrentPage);
	const onAdd = useHandlePage(PAGES.Add, setCurrentPage);
	const onDetails = useHandlePage(PAGES.Details, setCurrentPage);
	const onReturn = useHandlePage(PAGES.List, setCurrentPage);

	const handleDetails = useMutableCallback((_id) => {
		onDetails();
		setResponseId(_id);
	});

	const navigation = {
		onClose,
		onReturn,
	};

	if (currentPage === PAGES.Details) {
		return <CannedResponseDetails _id={responseId} onEdit={onEdit} {...navigation} />;
	}

	if (currentPage === PAGES.Edit) {
		return <CannedResponseEdit _id={responseId} onSave={onSave} {...navigation} />;
	}

	if (currentPage === PAGES.Add) {
		return <CannedResponseAdd onSave={onSave} {...navigation} />;
	}

	return (
		<VerticalBar>
			<VerticalBar.Header>
				<VerticalBar.Text>{t('Canned Responses')}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClose} />
			</VerticalBar.Header>

			<VerticalBar.Header>
				<TextInput value={filter} onChange={onChangeFilter} placeholder={t('Search')} />
			</VerticalBar.Header>

			<VerticalBar.ScrollableContent p='none'>
				<CannedResponsesList onDetails={handleDetails} onClose={onClose} responses={responses} />
			</VerticalBar.ScrollableContent>

			<VerticalBar.Footer>
				<ButtonGroup stretch>
					<Button onClick={onAdd}>
						<Icon name='plus' size='x16' />
						{t('New_Canned_Response')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</VerticalBar>
	);
};

export default memo(withData(CannedResponsesRouter));

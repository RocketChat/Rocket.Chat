import React, { useState } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { ButtonGroup, Button, Icon, TextInput } from '@rocket.chat/fuselage';

import CannedResponseEdit from './CannedResponseEdit';
import CannedResponseDetails from './CannedResponseDetails';
import CannedResponseAdd from './CannedResponseAdd';
import CannedResponsesList from './CannedResponsesList';
import VerticalBar from '../../../../client/components/VerticalBar';
import { useCannedResponses } from './useCannedResponses';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useMethod } from '../../../../client/contexts/ServerContext';

const PAGES = {
	List: 'list',
	Details: 'details',
	Edit: 'edit',
	Add: 'add',
};

const withData = (WrappedComponent) => ({ departmentId, onClose }) => {
	const [filter, setFilter] = useState('');
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleFilter = useMutableCallback((e) => {
		setFilter(e.currentTarget.value);
	});

	const responses = useCannedResponses(filter, departmentId);

	const save = useMethod('saveCannedResponse');

	const onSave = useMutableCallback(async (data, _id) => {
		try {
			await save(_id, {
				...data,
				...departmentId && {
					departmentId,
					scope: 'department',
				},
				...!departmentId && {
					scope: 'user',
				},
			});

			dispatchToastMessage({ type: 'success', message: t('Saved') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return <WrappedComponent
		onChangeFilter={handleFilter}
		filter={filter}
		onClose={onClose}
		responses={responses}
		onSave={onSave}
	/>;
};

const useHandlePage = (page, setCurrentPage) => useMutableCallback(() => {
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
		return <CannedResponseDetails _id={responseId} onEdit={onEdit} {...navigation}/>;
	}

	if (currentPage === PAGES.Edit) {
		return <CannedResponseEdit _id={responseId} onSave={onSave} {...navigation}/>;
	}

	if (currentPage === PAGES.Add) {
		return <CannedResponseAdd onSave={onSave} {...navigation}/>;
	}

	return <VerticalBar>
		<VerticalBar.Header>
			<VerticalBar.Text>{t('Canned Responses')}</VerticalBar.Text>
			<VerticalBar.Close onClick={onClose} />
		</VerticalBar.Header>

		<VerticalBar.Header>
			<TextInput value={filter} onChange={onChangeFilter} placeholder={t('Search')}/>
		</VerticalBar.Header>

		<VerticalBar.ScrollableContent p='none'>
			<CannedResponsesList onDetails={handleDetails} onClose={onClose} responses={responses}/>
		</VerticalBar.ScrollableContent>

		<VerticalBar.Footer>
			<ButtonGroup stretch>
				<Button onClick={onAdd}><Icon name='plus' size='x16'/>{t('New_Canned_Response')}</Button>
			</ButtonGroup>
		</VerticalBar.Footer>
	</VerticalBar>;
};

export default React.memo(withData(CannedResponsesRouter));

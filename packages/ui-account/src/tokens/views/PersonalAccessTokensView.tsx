import { Box, Pagination, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import {
	GenericNoResults,
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	usePagination,
	useResizeInlineBreakpoint,
} from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import AddPersonalAccessTokenForm from './AddPersonalAccessTokenForm';
import PersonalAccessTokenDialog from './PersonalAccessTokenDialog';
import PersonalAccessTokenRow from './PersonalAccessTokenRow';
import { getTokensPage } from '../logic/personalAccessTokens';
import type { PersonalAccessTokensViewModel } from '../logic/usePersonalAccessTokens';

export type PersonalAccessTokensViewProps = {
	vm: PersonalAccessTokensViewModel;
};

const PersonalAccessTokensView = ({ vm }: PersonalAccessTokensViewProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const [ref, isMedium] = useResizeInlineBreakpoint<HTMLElement>([600], 200);
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

	const { dialog, userId, confirmDialog, dismissDialog } = vm;

	useEffect(() => {
		if (!dialog) {
			return;
		}

		setModal(<PersonalAccessTokenDialog dialog={dialog} userId={userId} onConfirm={confirmDialog} onDismiss={dismissDialog} />);
		return () => setModal(null);
	}, [dialog, userId, confirmDialog, dismissDialog, setModal]);

	const headers = useMemo(
		() =>
			[
				<GenericTableHeaderCell key='name'>{t('API_Personal_Access_Token_Name')}</GenericTableHeaderCell>,
				isMedium && <GenericTableHeaderCell key='createdAt'>{t('Created_at')}</GenericTableHeaderCell>,
				<GenericTableHeaderCell key='lastTokenPart'>{t('Last_token_part')}</GenericTableHeaderCell>,
				<GenericTableHeaderCell key='2fa'>{t('Two Factor Authentication')}</GenericTableHeaderCell>,
				<GenericTableHeaderCell key='actions' />,
			].filter(Boolean),
		[isMedium, t],
	);

	if (vm.status === 'error') {
		return (
			<Box display='flex' justifyContent='center' alignItems='center' height='100%'>
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
					<StatesSubtitle>{t('We_Could_not_retrive_any_data')}</StatesSubtitle>
					<StatesSubtitle>{vm.errorMessage}</StatesSubtitle>
					<StatesActions>
						<StatesAction onClick={vm.retry}>{t('Retry')}</StatesAction>
					</StatesActions>
				</States>
			</Box>
		);
	}

	const page = getTokensPage(vm.tokens, current, itemsPerPage);

	return (
		<>
			<AddPersonalAccessTokenForm onCreate={vm.create} />
			{vm.status === 'loading' && (
				<GenericTable aria-busy>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={5} />
					</GenericTableBody>
				</GenericTable>
			)}
			{vm.status === 'ready' && page.length > 0 && (
				<>
					<GenericTable ref={ref}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{page.map((token) => (
								<PersonalAccessTokenRow
									key={token.lastTokenPart}
									token={token}
									isMedium={isMedium}
									onRegenerate={vm.requestRegenerate}
									onRemove={vm.requestRemove}
								/>
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={vm.tokens.length}
						onSetItemsPerPage={setItemsPerPage}
						onSetCurrent={setCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{vm.status === 'ready' && page.length === 0 && <GenericNoResults />}
		</>
	);
};

export default PersonalAccessTokensView;

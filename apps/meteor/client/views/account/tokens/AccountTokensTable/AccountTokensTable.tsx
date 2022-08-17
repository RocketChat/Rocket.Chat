import { Box, Pagination, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useSetModal, useToastMessageDispatch, useUserId, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, RefObject, useMemo, useCallback } from 'react';

import GenericModal from '../../../../components/GenericModal';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableBody,
	GenericTableLoadingTable,
	GenericTableHeaderCell,
} from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { useResizeInlineBreakpoint } from '../../../../hooks/useResizeInlineBreakpoint';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import AccountTokensRow from './AccountTokensRow';
import AddToken from './AddToken';

const AccountTokensTable = (): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const userId = useUserId();

	const regenerateToken = useMethod('personalAccessTokens:regenerateToken');
	const removeToken = useMethod('personalAccessTokens:removeToken');
	const { value: data, phase, error, reload } = useEndpointData('/v1/users.getPersonalAccessTokens');

	const [ref, isMedium] = useResizeInlineBreakpoint([600], 200) as [RefObject<HTMLElement>, boolean];

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const filteredTokens = useMemo(() => {
		if (!data?.tokens) {
			return null;
		}

		const sliceStart = current > data?.tokens.length ? data?.tokens.length - itemsPerPage : current;
		return data?.tokens.slice(sliceStart, sliceStart + itemsPerPage);
	}, [current, data?.tokens, itemsPerPage]);

	const closeModal = useCallback(() => setModal(null), [setModal]);

	const headers = useMemo(
		() =>
			[
				<GenericTableHeaderCell key={'name'}>{t('API_Personal_Access_Token_Name')}</GenericTableHeaderCell>,
				isMedium && <GenericTableHeaderCell key={'createdAt'}>{t('Created_at')}</GenericTableHeaderCell>,
				<GenericTableHeaderCell key={'lastTokenPart'}>{t('Last_token_part')}</GenericTableHeaderCell>,
				<GenericTableHeaderCell key={'2fa'}>{t('Two Factor Authentication')}</GenericTableHeaderCell>,
				<GenericTableHeaderCell key={'actions'} />,
			].filter(Boolean),
		[isMedium, t],
	);

	const handleRegenerate = useCallback(
		(name) => {
			const onConfirm: () => Promise<void> = async () => {
				try {
					setModal(null);
					const token = await regenerateToken({ tokenName: name });

					setModal(
						<GenericModal title={t('API_Personal_Access_Token_Generated')} onConfirm={closeModal}>
							<Box
								dangerouslySetInnerHTML={{
									__html: t('API_Personal_Access_Token_Generated_Text_Token_s_UserId_s', {
										token,
										userId,
									}),
								}}
							/>
						</GenericModal>,
					);

					reload();
				} catch (error) {
					setModal(null);
					dispatchToastMessage({ type: 'error', message: error });
				}
			};

			setModal(
				<GenericModal
					variant='warning'
					confirmText={t('API_Personal_Access_Tokens_Regenerate_It')}
					onConfirm={onConfirm}
					onCancel={closeModal}
					onClose={closeModal}
				>
					{t('API_Personal_Access_Tokens_Regenerate_Modal')}
				</GenericModal>,
			);
		},
		[closeModal, dispatchToastMessage, regenerateToken, reload, setModal, t, userId],
	);

	const handleRemove = useCallback(
		(name) => {
			const onConfirm: () => Promise<void> = async () => {
				try {
					await removeToken({ tokenName: name });
					dispatchToastMessage({ type: 'success', message: t('Token_has_been_removed') });
					reload();
					closeModal();
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			};

			setModal(
				<GenericModal variant='danger' confirmText={t('Remove')} onConfirm={onConfirm} onCancel={closeModal} onClose={closeModal}>
					{t('API_Personal_Access_Tokens_Remove_Modal')}
				</GenericModal>,
			);
		},
		[closeModal, dispatchToastMessage, reload, removeToken, setModal, t],
	);

	if (phase === AsyncStatePhase.REJECTED) {
		return (
			<Box display='flex' justifyContent='center' alignItems='center' height='100%'>
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_Went_Wrong')}</StatesTitle>
					<StatesSubtitle>{t('We_Could_not_retrive_any_data')}</StatesSubtitle>
					<StatesSubtitle>{error?.message}</StatesSubtitle>
					<StatesActions>
						<StatesAction onClick={reload}>{t('Retry')}</StatesAction>
					</StatesActions>
				</States>
			</Box>
		);
	}

	return (
		<>
			<AddToken reload={reload} />
			{phase === AsyncStatePhase.LOADING && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>{phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={5} />}</GenericTableBody>
				</GenericTable>
			)}
			{filteredTokens && filteredTokens?.length > 0 && phase === AsyncStatePhase.RESOLVED && (
				<>
					<GenericTable ref={ref}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{phase === AsyncStatePhase.RESOLVED &&
								filteredTokens &&
								filteredTokens.map((filteredToken) => (
									<AccountTokensRow
										{...filteredToken}
										key={filteredToken.createdAt}
										onRegenerate={handleRegenerate}
										onRemove={handleRemove}
										isMedium={isMedium}
									/>
								))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.tokens.length || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{phase === AsyncStatePhase.RESOLVED && filteredTokens?.length === 0 && (
				<States>
					<StatesIcon name='magnifier' />
					<StatesTitle>{t('No_results_found')}</StatesTitle>
				</States>
			)}
		</>
	);
};

export default AccountTokensTable;

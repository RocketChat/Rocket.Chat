import { Box, Pagination, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useUserId, useMethod, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import type { ReactElement, RefObject } from 'react';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import AccountTokensRow from './AccountTokensRow';
import AddToken from './AddToken';
import GenericNoResults from '../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableBody,
	GenericTableLoadingTable,
	GenericTableHeaderCell,
} from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useResizeInlineBreakpoint } from '../../../../hooks/useResizeInlineBreakpoint';
import { miscQueryKeys } from '../../../../lib/queryKeys';

const AccountTokensTable = (): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const userId = useUserId();

	const regenerateToken = useMethod('personalAccessTokens:regenerateToken');
	const removeToken = useMethod('personalAccessTokens:removeToken');

	const getPersonalAccessTokens = useEndpoint('GET', '/v1/users.getPersonalAccessTokens');
	const { isPending, isSuccess, data, isError, error } = useQuery({
		queryKey: miscQueryKeys.personalAccessTokens,
		queryFn: () => getPersonalAccessTokens(),
	});

	const queryClient = useQueryClient();

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
				<GenericTableHeaderCell key='name'>{t('API_Personal_Access_Token_Name')}</GenericTableHeaderCell>,
				isMedium && <GenericTableHeaderCell key='createdAt'>{t('Created_at')}</GenericTableHeaderCell>,
				<GenericTableHeaderCell key='lastTokenPart'>{t('Last_token_part')}</GenericTableHeaderCell>,
				<GenericTableHeaderCell key='2fa'>{t('Two Factor Authentication')}</GenericTableHeaderCell>,
				<GenericTableHeaderCell key='actions' />,
			].filter(Boolean),
		[isMedium, t],
	);

	const handleRegenerate = useCallback(
		(name: string) => {
			const onConfirm: () => Promise<void> = async () => {
				try {
					setModal(null);
					const token = await regenerateToken({ tokenName: name });

					setModal(
						<GenericModal title={t('API_Personal_Access_Token_Generated')} onConfirm={closeModal}>
							<Box
								dangerouslySetInnerHTML={{
									__html: DOMPurify.sanitize(
										t('API_Personal_Access_Token_Generated_Text_Token_s_UserId_s', {
											token,
											userId,
										}),
									),
								}}
							/>
						</GenericModal>,
					);

					queryClient.invalidateQueries({ queryKey: miscQueryKeys.personalAccessTokens });
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
		[closeModal, dispatchToastMessage, queryClient, regenerateToken, setModal, t, userId],
	);

	const handleRemove = useCallback(
		(name: string) => {
			const onConfirm: () => Promise<void> = async () => {
				try {
					await removeToken({ tokenName: name });
					dispatchToastMessage({ type: 'success', message: t('Token_has_been_removed') });
					queryClient.invalidateQueries({ queryKey: miscQueryKeys.personalAccessTokens });
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
		[closeModal, dispatchToastMessage, queryClient, removeToken, setModal, t],
	);

	if (isError) {
		return (
			<Box display='flex' justifyContent='center' alignItems='center' height='100%'>
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
					<StatesSubtitle>{t('We_Could_not_retrive_any_data')}</StatesSubtitle>
					<StatesSubtitle>{error?.message}</StatesSubtitle>
					<StatesActions>
						<StatesAction onClick={() => queryClient.invalidateQueries({ queryKey: miscQueryKeys.personalAccessTokens })}>
							{t('Retry')}
						</StatesAction>
					</StatesActions>
				</States>
			</Box>
		);
	}

	return (
		<>
			<AddToken reload={() => queryClient.invalidateQueries({ queryKey: miscQueryKeys.personalAccessTokens })} />
			{isPending && (
				<GenericTable aria-busy>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={5} />
					</GenericTableBody>
				</GenericTable>
			)}
			{filteredTokens && filteredTokens?.length > 0 && isSuccess && (
				<>
					<GenericTable ref={ref}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{isSuccess &&
								filteredTokens &&
								filteredTokens.map((filteredToken) => (
									<AccountTokensRow
										key={filteredToken.createdAt}
										onRegenerate={handleRegenerate}
										onRemove={handleRemove}
										isMedium={isMedium}
										{...filteredToken}
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
			{isSuccess && filteredTokens?.length === 0 && <GenericNoResults />}
		</>
	);
};

export default AccountTokensTable;

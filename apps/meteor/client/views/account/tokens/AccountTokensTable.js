import { Box } from '@rocket.chat/fuselage';
import { useSetModal, useToastMessageDispatch, useUserId, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback, useState } from 'react';

import GenericTable from '../../../components/GenericTable';
import { useResizeInlineBreakpoint } from '../../../hooks/useResizeInlineBreakpoint';
import AccountTokensRow from './AccountTokensRow';
import InfoModal from './InfoModal';

const AccountTokensTable = ({ data, reload }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const userId = useUserId();

	const regenerateToken = useMethod('personalAccessTokens:regenerateToken');
	const removeToken = useMethod('personalAccessTokens:removeToken');

	const [ref, isMedium] = useResizeInlineBreakpoint([600], 200);

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const tokensTotal = data && data.success ? data.tokens.length : 0;

	const { current, itemsPerPage } = params;

	const tokens = useMemo(() => {
		if (!data) {
			return null;
		}
		if (!data.success) {
			return [];
		}
		const sliceStart = current > tokensTotal ? tokensTotal - itemsPerPage : current;
		return data.tokens.slice(sliceStart, sliceStart + itemsPerPage);
	}, [current, data, itemsPerPage, tokensTotal]);

	const closeModal = useCallback(() => setModal(null), [setModal]);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell key={'name'}>{t('API_Personal_Access_Token_Name')}</GenericTable.HeaderCell>,
				isMedium && <GenericTable.HeaderCell key={'createdAt'}>{t('Created_at')}</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'lastTokenPart'}>{t('Last_token_part')}</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'2fa'}>{t('Two Factor Authentication')}</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'actions'} />,
			].filter(Boolean),
		[isMedium, t],
	);

	const onRegenerate = useCallback(
		(name) => {
			const onConfirm = async () => {
				try {
					setModal(null);

					const token = await regenerateToken({ tokenName: name });

					setModal(
						<InfoModal
							title={t('API_Personal_Access_Token_Generated')}
							content={
								<Box
									dangerouslySetInnerHTML={{
										__html: t('API_Personal_Access_Token_Generated_Text_Token_s_UserId_s', {
											token,
											userId,
										}),
									}}
								/>
							}
							confirmText={t('ok')}
							onConfirm={closeModal}
						/>,
					);

					reload();
				} catch (e) {
					setModal(null);
					dispatchToastMessage({ type: 'error', message: e });
				}
			};

			setModal(
				<InfoModal
					title={t('Are_you_sure')}
					content={t('API_Personal_Access_Tokens_Regenerate_Modal')}
					confirmText={t('API_Personal_Access_Tokens_Regenerate_It')}
					onConfirm={onConfirm}
					cancelText={t('Cancel')}
					onClose={closeModal}
				/>,
			);
		},
		[closeModal, dispatchToastMessage, regenerateToken, reload, setModal, t, userId],
	);

	const onRemove = useCallback(
		(name) => {
			const onConfirm = async () => {
				try {
					await removeToken({ tokenName: name });

					dispatchToastMessage({ type: 'success', message: t('Removed') });
					reload();
					closeModal();
				} catch (e) {
					dispatchToastMessage({ type: 'error', message: e });
				}
			};

			setModal(
				<InfoModal
					title={t('Are_you_sure')}
					content={t('API_Personal_Access_Tokens_Remove_Modal')}
					confirmText={t('Yes')}
					onConfirm={onConfirm}
					cancelText={t('Cancel')}
					onClose={closeModal}
				/>,
			);
		},
		[closeModal, dispatchToastMessage, reload, removeToken, setModal, t],
	);

	return (
		<GenericTable ref={ref} header={header} results={tokens} total={tokensTotal} setParams={setParams} params={params}>
			{useCallback(
				(props) => (
					<AccountTokensRow onRegenerate={onRegenerate} onRemove={onRemove} isMedium={isMedium} {...props} />
				),
				[isMedium, onRegenerate, onRemove],
			)}
		</GenericTable>
	);
};

export default AccountTokensTable;

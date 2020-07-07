import { Table, Button, ButtonGroup, Icon, Box } from '@rocket.chat/fuselage';
import React, { useMemo, useCallback, useState } from 'react';

import { GenericTable, Th } from '../../components/GenericTable';
import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useResizeInlineBreakpoint } from '../../hooks/useResizeInlineBreakpoint';
import { useFormatDateAndTime } from '../../hooks/useFormatDateAndTime';
import { InfoModal } from './AccountTokensPage';

const TokenRow = ({ lastTokenPart, name, createdAt, bypassTwoFactor, formatDateAndTime, onRegenerate, onRemove, t, isMedium }) => {
	const handleRegenerate = useCallback(() => onRegenerate(name), [name, onRegenerate]);
	const handleRemove = useCallback(() => onRemove(name), [name, onRemove]);

	return <Table.Row key={name} tabIndex={0} role='link' action qa-token-name={name}>
		<Table.Cell withTruncatedText color='default' fontScale='p2'>{name}</Table.Cell>
		{isMedium && <Table.Cell withTruncatedText>{formatDateAndTime(createdAt)}</Table.Cell>}
		<Table.Cell withTruncatedText>...{lastTokenPart}</Table.Cell>
		<Table.Cell withTruncatedText>{bypassTwoFactor ? t('Ignore') : t('Require')}</Table.Cell>
		<Table.Cell withTruncatedText>
			<ButtonGroup>
				<Button onClick={handleRegenerate} small><Icon name='refresh' size='x16'/></Button>
				<Button onClick={handleRemove} small><Icon name='trash' size='x16'/></Button>
			</ButtonGroup>
		</Table.Cell>
	</Table.Row>;
};

export function AccountTokensTable({ setModal, data, reload, userId }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const dispatchToastMessage = useToastMessageDispatch();

	const regenerateTokenFn = useMethod('personalAccessTokens:regenerateToken');
	const removeTokenFn = useMethod('personalAccessTokens:removeToken');

	const [ref, isMedium] = useResizeInlineBreakpoint([600], 200);

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const tokensTotal = data && data.success ? data.tokens.length : 0;

	const { current, itemsPerPage } = params;

	const tokens = useMemo(() => {
		if (!data) { return null; }
		if (!data.success) { return []; }
		const sliceStart = current > tokensTotal ? tokensTotal - itemsPerPage : current;
		return data.tokens.slice(sliceStart, sliceStart + itemsPerPage);
	}, [current, data, itemsPerPage, tokensTotal]);

	const closeModal = useCallback(() => setModal(null), [setModal]);

	const header = useMemo(() => [
		<Th key={'name'}>{t('API_Personal_Access_Token_Name')}</Th>,
		isMedium && <Th key={'createdAt'}>{t('Created_at')}</Th>,
		<Th key={'lastTokenPart'}>{t('Last_token_part')}</Th>,
		<Th key={'2fa'}>{t('Two Factor Authentication')}</Th>,
		<Th key={'actions'} />,
	].filter(Boolean), [isMedium, t]);

	const onRegenerate = useCallback((name) => {
		const onConfirm = async () => {
			try {
				const token = await regenerateTokenFn({ tokenName: name });

				setModal(<InfoModal
					title={t('API_Personal_Access_Token_Generated')}
					content={<Box dangerouslySetInnerHTML={{ __html: t('API_Personal_Access_Token_Generated_Text_Token_s_UserId_s', { token, userId }) }}/>}
					confirmText={t('ok')}
					onConfirm={closeModal}
				/>);

				reload();
			} catch (e) {
				dispatchToastMessage({ type: 'error', message: e });
			}
		};

		setModal(<InfoModal
			title={t('Are_you_sure')}
			content={t('API_Personal_Access_Tokens_Regenerate_Modal')}
			confirmText={t('API_Personal_Access_Tokens_Regenerate_It')}
			onConfirm={onConfirm}
			cancelText={t('Cancel')}
			onClose={closeModal}
		/>);
	}, [closeModal, dispatchToastMessage, regenerateTokenFn, reload, setModal, t, userId]);

	const onRemove = useCallback((name) => {
		const onConfirm = async () => {
			try {
				await removeTokenFn({ tokenName: name });

				dispatchToastMessage({ type: 'success', message: t('Removed') });
				reload();
				closeModal();
			} catch (e) {
				dispatchToastMessage({ type: 'error', message: e });
			}
		};

		setModal(<InfoModal
			title={t('Are_you_sure')}
			content={t('API_Personal_Access_Tokens_Remove_Modal')}
			confirmText={t('Yes')}
			onConfirm={onConfirm}
			cancelText={t('Cancel')}
			onClose={closeModal}
		/>);
	}, [closeModal, dispatchToastMessage, reload, removeTokenFn, setModal, t]);

	const renderRow = useCallback((props) => <TokenRow
		onRegenerate={onRegenerate}
		onRemove={onRemove}
		t={t}
		formatDateAndTime={formatDateAndTime}
		isMedium={isMedium}
		{...props}
	/>, [formatDateAndTime, isMedium, onRegenerate, onRemove, t]);

	return <GenericTable ref={ref} header={header} renderRow={renderRow} results={tokens} total={tokensTotal} setParams={setParams} params={params}/>;
}

export default AccountTokensTable;

import { Button, ButtonGroup, Callout, Stack, Text } from '@rocket.chat/fuselage';
import {
	GenericNoResults,
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	useResizeInlineBreakpoint,
} from '@rocket.chat/ui-client';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { useTranslation } from 'react-i18next';

import PasskeyRow from './PasskeyRow';
import { usePasskeys } from './usePasskeys';

export type PasskeysTableProps = {
	onOpen: (passkeyId: string) => void;
};

const PasskeysTable = ({ onOpen }: PasskeysTableProps) => {
	const { t } = useTranslation();
	const [ref, isMedium] = useResizeInlineBreakpoint<HTMLDivElement>([600], 200);
	const { data: passkeys, isPending, isError, refetch } = usePasskeys();

	const headers = [
		<GenericTableHeaderCell key='name'>{t('Name')}</GenericTableHeaderCell>,
		isMedium && <GenericTableHeaderCell key='kind'>{t('Type')}</GenericTableHeaderCell>,
		isMedium && <GenericTableHeaderCell key='createdAt'>{t('Passkey_added_at')}</GenericTableHeaderCell>,
		<GenericTableHeaderCell key='lastUsedAt'>{t('Passkey_last_used')}</GenericTableHeaderCell>,
	];

	return (
		<Stack ref={ref} gap='x16'>
			<Text is='p' fontScale='p2' color='hint'>
				{t('Passkeys_description')}
			</Text>
			{!browserSupportsWebAuthn() && <Callout type='warning'>{t('Passkeys_not_supported')}</Callout>}
			{isPending && (
				<GenericTable aria-busy>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={isMedium ? 4 : 2} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isError && (
				<Callout type='danger' title={t('Something_went_wrong')}>
					<ButtonGroup>
						<Button size='small' onClick={() => refetch()}>
							{t('Retry')}
						</Button>
					</ButtonGroup>
				</Callout>
			)}
			{passkeys?.length === 0 && !isError && (
				<GenericNoResults icon='fingerprint' title={t('No_passkeys')} description={t('No_passkeys_description')} />
			)}
			{passkeys && passkeys.length > 0 && (
				<GenericTable aria-label={t('Passkeys')}>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						{passkeys.map((passkey) => (
							<PasskeyRow key={passkey._id} passkey={passkey} isMedium={isMedium} onOpen={() => onOpen(passkey._id)} />
						))}
					</GenericTableBody>
				</GenericTable>
			)}
		</Stack>
	);
};

export default PasskeysTable;

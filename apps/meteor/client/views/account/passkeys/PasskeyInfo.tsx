import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import {
	ContextualbarClose,
	ContextualbarEmptyContent,
	ContextualbarFooter,
	ContextualbarHeader,
	ContextualbarScrollableContent,
	ContextualbarSkeletonBody,
	ContextualbarTitle,
	InfoPanel,
	InfoPanelField,
	InfoPanelLabel,
	InfoPanelText,
	useFormatDateAndTime,
} from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import PasskeyNameModal from './PasskeyNameModal';
import { formatPasskeyClient, getPasskeyKind, getPasskeyKindLabel } from './describePasskey';
import { usePasskeys } from './usePasskeys';
import { useRemovePasskey } from './useRemovePasskey';

export type PasskeyInfoProps = {
	passkeyId: string;
	onClose: () => void;
};

const PasskeyInfo = ({ passkeyId, onClose }: PasskeyInfoProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const formatDateAndTime = useFormatDateAndTime();
	const removePasskey = useRemovePasskey({ onRemoved: onClose });

	const { data: passkeys, isPending } = usePasskeys();
	const passkey = passkeys?.find(({ _id }) => _id === passkeyId);

	const header = (
		<ContextualbarHeader>
			<ContextualbarTitle>{t('Passkey_details')}</ContextualbarTitle>
			<ContextualbarClose onClick={onClose} />
		</ContextualbarHeader>
	);

	if (isPending) {
		return (
			<>
				{header}
				<ContextualbarSkeletonBody />
			</>
		);
	}

	if (!passkeys) {
		return (
			<>
				{header}
				<ContextualbarEmptyContent icon='warning' title={t('Something_went_wrong')} subtitle={t('Please_try_again')} />
			</>
		);
	}

	if (!passkey) {
		return (
			<>
				{header}
				<ContextualbarEmptyContent title={t('Passkey_not_found')} />
			</>
		);
	}

	const createdFrom = formatPasskeyClient(t, passkey.createdFrom);
	const lastUsedFrom = formatPasskeyClient(t, passkey.lastUsedFrom);

	return (
		<>
			{header}
			<ContextualbarScrollableContent>
				<InfoPanel>
					<InfoPanelField>
						<InfoPanelLabel>{t('Name')}</InfoPanelLabel>
						<InfoPanelText>{passkey.name}</InfoPanelText>
					</InfoPanelField>
					<InfoPanelField>
						<InfoPanelLabel>{t('Type')}</InfoPanelLabel>
						<InfoPanelText>{getPasskeyKindLabel(t, getPasskeyKind(passkey))}</InfoPanelText>
					</InfoPanelField>
					<InfoPanelField>
						<InfoPanelLabel>{t('Passkey_availability')}</InfoPanelLabel>
						<InfoPanelText>{passkey.backedUp ? t('Passkey_synced_description') : t('Passkey_device_bound_description')}</InfoPanelText>
					</InfoPanelField>
					<InfoPanelField>
						<InfoPanelLabel>{t('Passkey_added_at')}</InfoPanelLabel>
						<InfoPanelText>{formatDateAndTime(passkey.createdAt)}</InfoPanelText>
					</InfoPanelField>
					{createdFrom && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Passkey_added_from')}</InfoPanelLabel>
							<InfoPanelText>{createdFrom}</InfoPanelText>
						</InfoPanelField>
					)}
					<InfoPanelField>
						<InfoPanelLabel>{t('Passkey_last_used')}</InfoPanelLabel>
						<InfoPanelText>{passkey.lastUsedAt ? formatDateAndTime(passkey.lastUsedAt) : t('Never')}</InfoPanelText>
					</InfoPanelField>
					{lastUsedFrom && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Passkey_last_used_from')}</InfoPanelLabel>
							<InfoPanelText>{lastUsedFrom}</InfoPanelText>
						</InfoPanelField>
					)}
				</InfoPanel>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={() => setModal(<PasskeyNameModal passkey={passkey} onClose={() => setModal(null)} />)}>
						{t('Rename_passkey')}
					</Button>
					<Button variant='danger' onClick={() => removePasskey(passkey)}>
						{t('Remove_passkey')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default PasskeyInfo;

import { Divider, IconButton, Stack, Text } from '@rocket.chat/fuselage';
import { ActionLink } from '@rocket.chat/layout';
import { useClipboardWithToast } from '@rocket.chat/ui-client';
import { usePermission, useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import ManageLicenseModal from './ManageLicenseModal';
import { useServerInfo } from '../../../../../../hooks/useWorkspaceInfo';

const PlanCardLicenseDetails = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const hasPermission = usePermission('edit-privileged-setting');
	const siteURL = useSetting('Site_Url', '');
	const enterpriseLicense = useSetting('Enterprise_License', '');
	const { data: serverInfo } = useServerInfo();

	const hashedSiteURL = serverInfo?.hashedWorkspaceUrl ?? '';
	const { copy: copySiteURL, hasCopied: hasCopiedSiteURL } = useClipboardWithToast(siteURL);
	const { copy: copyHashed, hasCopied: hasCopiedHashed } = useClipboardWithToast(hashedSiteURL);

	const handleOpenModal = useCallback(
		() => setModal(<ManageLicenseModal enterpriseLicense={enterpriseLicense} onCancel={() => setModal(null)} />),
		[enterpriseLicense, setModal],
	);

	if (!hasPermission) {
		return null;
	}

	return (
		<>
			<Divider />
			<Stack>
				<Stack direction='row' gap='x4'>
					<Text>{t('Site_Url')}</Text>
					{hasCopiedSiteURL ? (
						<IconButton variant='success' icon='check' size='mini' />
					) : (
						<IconButton title={t('Copy')} icon='clipboard' size='mini' onClick={() => !hasCopiedSiteURL && copySiteURL()} />
					)}
				</Stack>
				<Text truncate fontScale='p2'>
					{siteURL}
				</Text>
			</Stack>
			<Stack>
				<Stack direction='row' gap='x4'>
					<Text>{t('Hashed_Site_Url')}</Text>
					{hasCopiedHashed ? (
						<IconButton variant='success' icon='check' size='mini' />
					) : (
						<IconButton title={t('Copy')} icon='clipboard' size='mini' onClick={() => !hasCopiedHashed && copyHashed()} />
					)}
				</Stack>
				<Text truncate fontScale='p2'>
					{hashedSiteURL}
				</Text>
			</Stack>
			<ActionLink onClick={handleOpenModal}>{t('Manage_license')}</ActionLink>
		</>
	);
};

export default PlanCardLicenseDetails;

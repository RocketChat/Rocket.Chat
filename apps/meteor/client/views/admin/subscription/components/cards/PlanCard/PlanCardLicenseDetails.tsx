import { Divider, IconButton, Text } from '@rocket.chat/fuselage';
import { ActionLink } from '@rocket.chat/layout';
import { useClipboardWithToast } from '@rocket.chat/ui-client';
import { usePermission, useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import ManageLicenseModal from './ManageLicenseModal';
import { useServerInfo } from '../../../../../../hooks/useWorkspaceInfo';
import LicenseDetail from '../../../layout/LicenseDetail';

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
			<LicenseDetail
				label={<Text>{t('Site_Url')}</Text>}
				action={
					hasCopiedSiteURL ? (
						<IconButton variant='success' icon='check' size='mini' />
					) : (
						<IconButton title={t('Copy')} icon='clipboard' size='mini' onClick={() => !hasCopiedSiteURL && copySiteURL()} />
					)
				}
			>
				<Text truncate fontScale='p2'>
					{siteURL}
				</Text>
			</LicenseDetail>
			<LicenseDetail
				label={<Text>{t('Hashed_Site_Url')}</Text>}
				action={
					hasCopiedHashed ? (
						<IconButton variant='success' icon='check' size='mini' />
					) : (
						<IconButton title={t('Copy')} icon='clipboard' size='mini' onClick={() => !hasCopiedHashed && copyHashed()} />
					)
				}
			>
				<Text truncate fontScale='p2'>
					{hashedSiteURL}
				</Text>
			</LicenseDetail>
			<ActionLink onClick={handleOpenModal}>{t('Manage_license')}</ActionLink>
		</>
	);
};

export default PlanCardLicenseDetails;

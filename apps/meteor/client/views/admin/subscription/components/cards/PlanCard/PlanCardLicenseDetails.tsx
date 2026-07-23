import { IconButton, Divider, Box } from '@rocket.chat/fuselage';
import { ActionLink } from '@rocket.chat/layout';
import { usePermission, useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import ManageLicenseModal from './ManageLicenseModal';
import useClipboardWithToast from '../../../../../../hooks/useClipboardWithToast';
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
			<Box>
				<Box display='flex'>
					<Box marginInlineEnd={4}>{t('Site_Url')}</Box>
					{hasCopiedSiteURL ? (
						<IconButton success icon='check' mini />
					) : (
						<IconButton title={t('Copy')} icon='clipboard' mini onClick={() => !hasCopiedSiteURL && copySiteURL()} />
					)}
				</Box>
				<Box withTruncatedText fontScale='p2'>
					{siteURL}
				</Box>
			</Box>
			<Box>
				<Box display='flex'>
					<Box marginInlineEnd={4}>{t('Hashed_Site_Url')}</Box>
					{hasCopiedHashed ? (
						<IconButton success icon='check' mini />
					) : (
						<IconButton title={t('Copy')} icon='clipboard' mini onClick={() => !hasCopiedHashed && copyHashed()} />
					)}
				</Box>
				<Box withTruncatedText fontScale='p2'>
					{hashedSiteURL}
				</Box>
			</Box>
			<ActionLink onClick={handleOpenModal}>{t('Manage_license')}</ActionLink>
		</>
	);
};

export default PlanCardLicenseDetails;

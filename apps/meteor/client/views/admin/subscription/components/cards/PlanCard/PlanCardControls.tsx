import { IconButton, Divider, Box } from '@rocket.chat/fuselage';
import { useClipboard } from '@rocket.chat/fuselage-hooks';
import { ActionLink } from '@rocket.chat/layout';
import { useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import ManageLicenseModal from './ManageLicenseModal';
import { useServerInfo } from '../../../../../../hooks/useWorkspaceInfo';

const PlanCardControls = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const siteURL = useSetting('Site_Url', '');
	const enterpriseLicense = useSetting('Enterprise_License', '');
	const { data: serverInfo } = useServerInfo();
	const hashedSiteURL = serverInfo?.hashedWorkspaceUrl ?? '';
	const { copy: copySiteURL, hasCopied: hasCopiedSiteURL } = useClipboard(siteURL);
	const { copy: copyHashed, hasCopied: hasCopiedHashed } = useClipboard(hashedSiteURL);

	return (
		<>
			<Divider />
			<Box>
				<Box display='flex'>
					<Box mie={4}>{t('Site_Url')}</Box>
					{hasCopiedSiteURL ? (
						<IconButton success icon='check' mini />
					) : (
						<IconButton title={t('Copy')} icon='clipboard' mini onClick={() => copySiteURL()} />
					)}
				</Box>
				<Box withTruncatedText fontScale='p2'>
					{siteURL}
				</Box>
			</Box>
			<Box>
				<Box display='flex'>
					<Box mie={4}>{t('Hashed_Site_Url')}</Box>
					{hasCopiedHashed ? (
						<IconButton success icon='check' mini />
					) : (
						<IconButton title={t('Copy')} icon='clipboard' mini onClick={() => copyHashed()} />
					)}
				</Box>
				<Box withTruncatedText fontScale='p2'>
					{hashedSiteURL}
				</Box>
			</Box>
			<Box>
				<Box display='flex'>
					<Box mie={4}>{t('License_key')}</Box>
					{enterpriseLicense && (
						<IconButton
							title={t('Manage_license')}
							icon='cog'
							mini
							onClick={() => setModal(<ManageLicenseModal enterpriseLicense={enterpriseLicense} onCancel={() => setModal(null)} />)}
						/>
					)}
				</Box>
				{enterpriseLicense ? (
					<Box withTruncatedText fontScale='p2'>
						{enterpriseLicense}
					</Box>
				) : (
					<ActionLink
						onClick={() => setModal(<ManageLicenseModal enterpriseLicense={enterpriseLicense} onCancel={() => setModal(null)} />)}
					>
						{t('Add_license')}
					</ActionLink>
				)}
			</Box>
		</>
	);
};

export default PlanCardControls;

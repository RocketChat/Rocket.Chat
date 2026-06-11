import { IconButton, Divider, Box } from '@rocket.chat/fuselage';
import { useClipboard } from '@rocket.chat/fuselage-hooks';
import { ActionLink } from '@rocket.chat/layout';
import { useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import ManageLicenseModal from './ManageLicenseModal';

const PlanCardControls = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const enterpriseLicense = useSetting('Enterprise_License', '');
	const { copy: copyRootURL, hasCopied: hasCopiedRootURL } = useClipboard('https://your-rocketchat-url.com');
	const { copy: copyHashed, hasCopied: hasCopiedHashed } = useClipboard('738cb578f75b195353fa57f6ff547b64af77cf24572e10...');

	return (
		<>
			<Divider />
			<Box>
				<Box display='flex'>
					<Box mie={4}>Root URL</Box>
					{hasCopiedRootURL ? (
						<IconButton success icon='check' mini />
					) : (
						<IconButton title={t('Copy')} icon='clipboard' mini onClick={() => copyRootURL()} />
					)}
				</Box>
				<Box withTruncatedText fontScale='p2'>
					https://your-rocketchat-url.com
				</Box>
			</Box>
			<Box>
				<Box display='flex'>
					<Box mie={4}>Hashed root URL</Box>
					{hasCopiedHashed ? (
						<IconButton success icon='check' mini />
					) : (
						<IconButton title={t('Copy')} icon='clipboard' mini onClick={() => copyHashed()} />
					)}
				</Box>
				<Box withTruncatedText fontScale='p2'>
					738cb578f75b195353fa57f6ff547b64af77cf24572e10...
				</Box>
			</Box>

			<Box>
				<Box display='flex'>
					<Box mie={4}>License key</Box>
					{enterpriseLicense && (
						<IconButton
							title='Manage license'
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
						Add license
					</ActionLink>
				)}
			</Box>
		</>
	);
};

export default PlanCardControls;

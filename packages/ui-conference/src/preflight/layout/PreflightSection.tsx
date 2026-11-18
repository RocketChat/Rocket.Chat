import { Box, IconButton } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type PreflightSectionProps = { title: string; onClose: () => void; children: ReactNode };

const PreflightSection = ({ title, onClose, children }: PreflightSectionProps) => {
	const { t } = useTranslation();

	return (
		<Box is='section' width='100%' marginBlockStart='x16' paddingInline='x20'>
			<Box display='flex' alignItems='center' justifyContent='space-between' marginBlockEnd='x8'>
				<Box is='h3' fontScale='h5' color='default'>
					{title}
				</Box>
				<IconButton icon='cross' size='small' title={t('Close')} aria-label={t('Close')} onClick={onClose} />
			</Box>
			{children}
		</Box>
	);
};

export default PreflightSection;

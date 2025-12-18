import { Box, Icon } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

type PreviewItemProps = {
	label: string;
	icon: Keys;
	children: ReactNode;
};

const PreviewItem = ({ icon, label, children }: PreviewItemProps) => {
	const { t } = useTranslation();
	const id = useId();

	return (
		<Box display='flex'>
			<Icon size={18} name={icon} />
			<Box mis={6}>
				<Box is='span' id={id} fontScale='p2m'>
					{label}
				</Box>
				<div aria-labelledby={id}>
					{children ?? (
						<Box fontScale='p2' color='disabled'>
							{t('None')}
						</Box>
					)}
				</div>
			</Box>
		</Box>
	);
};

export default PreviewItem;

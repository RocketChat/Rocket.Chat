import { Box, Icon, Text } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

export type PreviewItemProps = {
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
			<Box marginInlineStart='x4'>
				<Text is='span' id={id} fontScale='p2m'>
					{label}
				</Text>
				<div aria-labelledby={id}>
					{children ?? (
						<Text fontScale='p2' color='disabled'>
							{t('None')}
						</Text>
					)}
				</div>
			</Box>
		</Box>
	);
};

export default PreviewItem;

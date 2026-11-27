import { Icon, Item, ItemContent, ItemDescription, ItemIcon, ItemTitle, Text } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type PreviewItemProps = {
	label: string;
	icon: Keys;
	children: ReactNode;
};

const PreviewItem = ({ icon, label, children }: PreviewItemProps) => {
	const { t } = useTranslation();

	return (
		<Item is='li' inset='none' align='start' multiline>
			<ItemIcon>
				<Icon name={icon} size='x20' />
			</ItemIcon>
			<ItemContent>
				<ItemTitle>{label}</ItemTitle>
				<ItemDescription truncate={false}>
					{children ?? (
						<Text is='span' color='disabled'>
							{t('None')}
						</Text>
					)}
				</ItemDescription>
			</ItemContent>
		</Item>
	);
};

export default PreviewItem;

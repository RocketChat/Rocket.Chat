import { Button, Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type OutlookSettingItemProps = {
	id: string;
	title: string;
	subTitle: string;
	enabled: boolean;
	handleEnable: (value: boolean) => void;
};

const OutlookSettingItem = ({ id, title, subTitle, enabled, handleEnable }: OutlookSettingItemProps) => {
	const { t } = useTranslation();

	return (
		<Item inset='lg' insetBlock='md' align='start' divided hoverable multiline>
			<ItemContent>
				<ItemTitle truncate={false}>{title}</ItemTitle>
				<ItemDescription truncate={false}>{subTitle}</ItemDescription>
			</ItemContent>
			<ItemActions>
				{id === 'authentication' && (
					<Button size='small' onClick={() => handleEnable(!enabled)}>
						{t('Disable')}
					</Button>
				)}
				{id !== 'authentication' && (
					<Button variant={!enabled ? 'primary' : undefined} size='small' onClick={() => handleEnable(!enabled)}>
						{enabled ? t('Disable') : t('Enable')}
					</Button>
				)}
			</ItemActions>
		</Item>
	);
};

export default OutlookSettingItem;

import { Box, Icon, Option, OptionColumn, OptionContent } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useCloseDeviceMenu } from './DeviceMenuContext';

export type DeviceMenuOptionProps = {
	/** Empty for a device the browser has not named yet: permission was granted after it was enumerated. */
	name: string;
	note?: string;
	selected: boolean;
	onSelect: () => void;
};

/** One choice in a device menu; picking it closes the menu. */
const DeviceMenuOption = ({ name, note, selected, onSelect }: DeviceMenuOptionProps) => {
	const { t } = useTranslation();
	const close = useCloseDeviceMenu();

	return (
		<Option
			selected={selected}
			onClick={() => {
				onSelect();
				close();
			}}
		>
			<OptionContent>
				<Box withTruncatedText>{name || t('Default')}</Box>
				{note && (
					<Box fontScale='c1' color='hint'>
						{note}
					</Box>
				)}
			</OptionContent>
			{selected && (
				<OptionColumn>
					<Icon name='check' size='x20' color='status-font-on-info' />
				</OptionColumn>
			)}
		</Option>
	);
};

export default DeviceMenuOption;

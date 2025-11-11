import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Divider, Tag } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { InfoPanelField, InfoPanelLabel } from '../../../../../../components/InfoPanel';
import { RoomIcon } from '../../../../../../components/RoomIcon';

// TODO: Remove type union when ABAC is implemented
type RoomInfoABACSectionProps = {
	room: IRoom & {
		abacAttributes: {
			name: string;
			values: string[];
		}[];
	};
};

const RoomInfoABACSection = ({ room }: RoomInfoABACSectionProps) => {
	const { t } = useTranslation();

	const abacEnabled = useSetting('ABAC_Enabled');
	const showAttributesInRoom = useSetting('ABAC_ShowAttributesInRooms');

	if (!abacEnabled || !showAttributesInRoom || !room.abacAttributes || room.abacAttributes.length === 0) {
		return null;
	}

	return (
		<>
			<Divider mb={32} width='full' />
			<InfoPanelField>
				<Box display='flex' mbe={16}>
					<Tag medium>
						<Box display='flex' alignItems='center'>
							<RoomIcon room={room} />
							<Box mis={2}>{t('ABAC_Managed')}</Box>
						</Box>
					</Tag>
				</Box>

				{t('ABAC_Managed_description')}

				<InfoPanelLabel>{t('ABAC_Room_Attributes')}</InfoPanelLabel>
				{room.abacAttributes.map((attribute) => (
					<Box key={attribute.name} mb={16}>
						{attribute.name}
						<Box display='flex' mbs={8} alignItems='center'>
							{attribute.values.map((value) => (
								<Box mie={4} key={value}>
									<Tag medium>{value}</Tag>
								</Box>
							))}
						</Box>
					</Box>
				))}
			</InfoPanelField>
		</>
	);
};

export default RoomInfoABACSection;

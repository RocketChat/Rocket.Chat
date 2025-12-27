import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Divider, Tag } from '@rocket.chat/fuselage';
import { InfoPanelField, InfoPanelLabel } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { RoomIcon } from '../../../../../../components/RoomIcon';

// TODO: Remove type union when ABAC is implemented
type RoomInfoABACSectionProps = {
	room: IRoom & {
		abacAttributes?: {
			key: string;
			values: string[];
		}[];
	};
};

const RoomInfoABACSection = ({ room }: RoomInfoABACSectionProps) => {
	const { t } = useTranslation();

	const abacEnabled = useSetting('ABAC_Enabled');
	const showAttributesInRoom = useSetting('ABAC_ShowAttributesInRooms');

	if (!abacEnabled || !showAttributesInRoom || !room.abacAttributes?.length) {
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

				<InfoPanelLabel id='room-attributes-list-label'>{t('ABAC_Room_Attributes')}</InfoPanelLabel>
				<Box is='ul' aria-labelledby='room-attributes-list-label'>
					{room.abacAttributes.map((attribute) => (
						<Box is='li' key={attribute.key} mb={16}>
							<Box is='span' id={`room-attribute-${attribute.key}-label`}>
								{attribute.key}
							</Box>
							<Box is='ul' display='flex' mbs={8} alignItems='center' aria-labelledby={`room-attribute-${attribute.key}-label`}>
								{attribute.values.map((value) => (
									<Box is='li' mie={4} key={value}>
										<Tag medium>{value}</Tag>
									</Box>
								))}
							</Box>
						</Box>
					))}
				</Box>
			</InfoPanelField>
		</>
	);
};

export default RoomInfoABACSection;

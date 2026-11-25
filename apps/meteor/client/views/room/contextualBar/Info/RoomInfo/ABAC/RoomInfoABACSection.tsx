import type { IRoom } from '@rocket.chat/core-typings';
import { Divider, Stack, Tag, Text } from '@rocket.chat/fuselage';
import { InfoPanelField, InfoPanelLabel } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { RoomIcon } from '../../../../../../components/RoomIcon';

// TODO: Remove type union when ABAC is implemented
export type RoomInfoABACSectionProps = {
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
			<Divider />
			<InfoPanelField>
				<Stack align='start' gap='x16'>
					<Tag medium icon={<RoomIcon room={room} />}>
						{t('ABAC_Managed')}
					</Tag>
					{t('ABAC_Managed_description')}
				</Stack>

				<InfoPanelLabel id='room-attributes-list-label'>{t('ABAC_Room_Attributes')}</InfoPanelLabel>
				<ul aria-labelledby='room-attributes-list-label'>
					{room.abacAttributes.map((attribute) => (
						<InfoPanelField is='li' key={attribute.key}>
							<Stack gap='x8'>
								<Text is='span' id={`room-attribute-${attribute.key}-label`}>
									{attribute.key}
								</Text>
								<Stack is='ul' direction='row' wrap align='center' gap='x4' aria-labelledby={`room-attribute-${attribute.key}-label`}>
									{attribute.values.map((value) => (
										<Stack is='li' key={value}>
											<Tag medium>{value}</Tag>
										</Stack>
									))}
								</Stack>
							</Stack>
						</InfoPanelField>
					))}
				</ul>
			</InfoPanelField>
		</>
	);
};

export default RoomInfoABACSection;

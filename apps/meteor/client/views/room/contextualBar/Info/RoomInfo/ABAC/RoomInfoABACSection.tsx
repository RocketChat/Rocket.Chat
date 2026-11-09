import type { IRoom } from '@rocket.chat/core-typings';
import { Tag, Text } from '@rocket.chat/fuselage';
import { InfoPanelField, InfoPanelLabel } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import AbacAttributeItem from './layout/AbacAttributeItem';
import AbacAttributeValues from './layout/AbacAttributeValues';
import AbacManagedTag from './layout/AbacManagedTag';
import AbacSectionDivider from './layout/AbacSectionDivider';
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
			<AbacSectionDivider />
			<InfoPanelField>
				<AbacManagedTag icon={<RoomIcon room={room} />}>{t('ABAC_Managed')}</AbacManagedTag>

				{t('ABAC_Managed_description')}

				<InfoPanelLabel id='room-attributes-list-label'>{t('ABAC_Room_Attributes')}</InfoPanelLabel>
				<ul aria-labelledby='room-attributes-list-label'>
					{room.abacAttributes.map((attribute) => (
						<AbacAttributeItem key={attribute.key}>
							<Text is='span' id={`room-attribute-${attribute.key}-label`}>
								{attribute.key}
							</Text>
							<AbacAttributeValues aria-labelledby={`room-attribute-${attribute.key}-label`}>
								{attribute.values.map((value) => (
									<Tag medium key={value}>
										{value}
									</Tag>
								))}
							</AbacAttributeValues>
						</AbacAttributeItem>
					))}
				</ul>
			</InfoPanelField>
		</>
	);
};

export default RoomInfoABACSection;

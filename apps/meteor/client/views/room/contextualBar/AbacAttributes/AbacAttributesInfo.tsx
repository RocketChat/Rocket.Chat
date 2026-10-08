import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Tag } from '@rocket.chat/fuselage';
import {
	ContextualbarClose,
	ContextualbarEmptyContent,
	ContextualbarFooter,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarScrollableContent,
	ContextualbarTitle,
} from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

export const getAttributeRows = (attributes: IAbacAttributeDefinition[], requiredKeys: string[]): IAbacAttributeDefinition[] => {
	const setAttributes = attributes.filter(({ values }) => values.length > 0);
	const missingRequired = requiredKeys
		.filter((key) => !setAttributes.some((attribute) => attribute.key === key))
		.map((key) => ({ key, values: [] }));

	return [...setAttributes, ...missingRequired];
};

type AbacAttributesInfoProps = {
	attributes: IAbacAttributeDefinition[];
	requiredKeys: string[];
	isTeam: boolean;
	onManage: () => void;
	onClose: () => void;
};

const AbacAttributesInfo = ({ attributes, requiredKeys, isTeam, onManage, onClose }: AbacAttributesInfoProps) => {
	const { t } = useTranslation();
	const rows = getAttributeRows(attributes, requiredKeys);

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='shield' />
				<ContextualbarTitle>{t('ABAC_Attribute_based_access_control')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			{rows.length === 0 ? (
				<ContextualbarEmptyContent
					icon='shield'
					title={t('ABAC_Room_attributes_missing')}
					subtitle={t(isTeam ? 'ABAC_Room_attributes_missing_team' : 'ABAC_Room_attributes_missing_channel')}
				/>
			) : (
				<ContextualbarScrollableContent>
					<Box is='h4' fontScale='h4' color='titles-labels'>
						{t('ABAC_Room_Attributes')}
					</Box>
					<Box fontScale='p2' color='hint' marginBlockStart={8}>
						{t('ABAC_Room_attributes_description')}
					</Box>
					{rows.map(({ key, values }) => (
						<Box key={key} is='section' aria-label={key} marginBlockStart={24}>
							<Box fontScale='p1' color='default' marginBlockEnd={8}>
								{key}
							</Box>
							<Box display='flex' flexWrap='wrap'>
								{values.length === 0 && <Tag variant='danger'>{t('ABAC_Not_set')}</Tag>}
								{values.map((value) => (
									<Tag key={value} marginInlineEnd={4} marginBlockEnd={4}>
										{value}
									</Tag>
								))}
							</Box>
						</Box>
					))}
				</ContextualbarScrollableContent>
			)}
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button primary onClick={onManage}>
						{t('ABAC_Manage_attributes')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AbacAttributesInfo;

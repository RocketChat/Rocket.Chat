import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { Button, ButtonGroup, Stack, Tag, Text } from '@rocket.chat/fuselage';
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
					<Stack gap='x40'>
						<Stack gap='x24'>
							<Text is='h4' fontScale='h4' color='titles-labels'>
								{t('ABAC_Room_Attributes')}
							</Text>
							<Text fontScale='p2' color='hint'>
								{t('ABAC_Room_attributes_description')}
							</Text>
						</Stack>
						{rows.map(({ key, values }) => (
							<Stack is='section' key={key} aria-label={key} gap='x8'>
								<Text fontScale='p1' color='default'>
									{key}
								</Text>
								<Stack is='ul' direction='row' wrap gap='x4'>
									{values.length === 0 && (
										<Stack is='li'>
											<Tag variant='danger'>{t('ABAC_Not_set')}</Tag>
										</Stack>
									)}
									{values.map((value) => (
										<Stack is='li' key={value}>
											<Tag>{value}</Tag>
										</Stack>
									))}
								</Stack>
							</Stack>
						))}
					</Stack>
				</ContextualbarScrollableContent>
			)}
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button variant='primary' onClick={onManage}>
						{t('ABAC_Manage_attributes')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AbacAttributesInfo;

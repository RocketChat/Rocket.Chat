import { Box, Button, Card, CardBody, CardControls, CardHeader, Icon, Tag } from '@rocket.chat/fuselage';
import { useRole, useSettingSetValue, useSetting, useToastMessageDispatch, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';

import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import CustomHomepageContent from '../CustomHomePageContent';

const CustomContentCard = (props: Omit<ComponentProps<typeof Card>, 'type'>): ReactElement | null => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const router = useRouter();

	const { data } = useIsEnterprise();
	const isAdmin = useRole('admin');
	const customContentBody = useSetting('Layout_Home_Body', '');
	const isCustomContentBodyEmpty = customContentBody === '';
	const isCustomContentVisible = useSetting('Layout_Home_Custom_Block_Visible', false);
	const isCustomContentOnly = useSetting('Layout_Custom_Body_Only', false);

	const setCustomContentVisible = useSettingSetValue('Layout_Home_Custom_Block_Visible');
	const setCustomContentOnly = useSettingSetValue('Layout_Custom_Body_Only');

	const handleChangeCustomContentVisibility = async () => {
		try {
			await setCustomContentVisible(!isCustomContentVisible);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleOnlyShowCustomContent = async () => {
		try {
			await setCustomContentOnly(!isCustomContentOnly);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const isEnterprise = data?.isEnterprise;
	const willNotShowCustomContent = isCustomContentBodyEmpty || !isCustomContentVisible;

	const userVisibilityTooltipText = isCustomContentVisible ? t('Now_Its_Visible_For_Everyone') : t('Now_Its_Visible_Only_For_Admins');

	let customContentOnlyTooltipText = t('It_Will_Hide_All_Other_Content_Blocks_In_The_Homepage');
	if (willNotShowCustomContent) {
		customContentOnlyTooltipText = t('Action_Available_After_Custom_Content_Added_And_Visible');
	} else if (isCustomContentOnly) {
		customContentOnlyTooltipText = t('It_Will_Show_All_Other_Content_Blocks_In_The_Homepage');
	}

	if (isAdmin) {
		return (
			<Card data-qa-id='homepage-custom-card' {...props}>
				<CardHeader>
					<Tag>
						<Icon mie={4} name={willNotShowCustomContent ? 'eye-off' : 'eye'} size='x12' />
						{willNotShowCustomContent ? t('Not_Visible_To_Workspace') : t('Visible_To_Workspace')}
					</Tag>
				</CardHeader>
				<CardBody>{isCustomContentBodyEmpty ? t('Homepage_Custom_Content_Default_Message') : <CustomHomepageContent />}</CardBody>
				<CardControls>
					<Button medium onClick={() => router.navigate('/admin/settings/Layout')} title={t('Layout_Home_Page_Content')}>
						{t('Customize_Content')}
					</Button>
					<Button
						icon={willNotShowCustomContent ? 'eye' : 'eye-off'}
						disabled={isCustomContentBodyEmpty || (isCustomContentVisible && isCustomContentOnly)}
						title={isCustomContentBodyEmpty ? t('Action_Available_After_Custom_Content_Added') : userVisibilityTooltipText}
						onClick={handleChangeCustomContentVisibility}
						medium
					>
						{willNotShowCustomContent ? t('Show_To_Workspace') : t('Hide_On_Workspace')}
					</Button>
					<Button
						icon='lightning'
						disabled={willNotShowCustomContent || !isEnterprise}
						title={!isEnterprise ? t('Premium_only') : customContentOnlyTooltipText}
						onClick={handleOnlyShowCustomContent}
						medium
					>
						{!isCustomContentOnly ? t('Show_Only_This_Content') : t('Show_default_content')}
					</Button>
				</CardControls>
			</Card>
		);
	}

	if (!willNotShowCustomContent && !isCustomContentOnly) {
		return (
			<Card>
				<Box mb={8}>
					<CustomHomepageContent role='status' aria-label={customContentBody} />
				</Box>
			</Card>
		);
	}
	return <CustomHomepageContent role='status' aria-label={customContentBody} />;
};

export default CustomContentCard;

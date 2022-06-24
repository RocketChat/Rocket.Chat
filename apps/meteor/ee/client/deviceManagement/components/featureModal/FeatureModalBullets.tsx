import { Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ComponentProps } from 'react';

type Props = {
	title: string;
	subtitle: string;
	icon: ComponentProps<typeof Icon>['name'];
};

const FeatureModalBullets = ({ title, subtitle, icon }: Props) => {
	const t = useTranslation();

	return (
		<Box display='flex'>
			<Box w='x40' h='x40' bg='primary-300-40' borderRadius='x40' mbe='x16' marginInlineEnd='x16' color='primary'>
				<Icon height='100%' display='flex' justifyContent='center' alignItems='center' name={icon} size='x25' />
			</Box>
			<Box mbe='x18'>
				<Box mbe='x6'><strong>{t(title)}</strong></Box>
				<Box display='flex' justifyContent='stretch'>{t(subtitle)}</Box>
			</Box>
		</Box>
	)
};

export default FeatureModalBullets;

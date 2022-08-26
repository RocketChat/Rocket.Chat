import { Box, Icon } from '@rocket.chat/fuselage';
import React, { ComponentProps, ReactElement } from 'react';

type FeatureModalBulletsProps = {
	title: string;
	subtitle: string;
	icon: ComponentProps<typeof Icon>['name'];
};

const FeatureModalBullets = ({ title, subtitle, icon }: FeatureModalBulletsProps): ReactElement => (
	<Box display='flex' mbe='x18'>
		<Box size='x40' bg='primary-300-40' borderRadius='x40' mie='x16' display='flex' justifyContent='center' alignItems='center'>
			<Icon name={icon} size='x25' color='primary' />
		</Box>
		<Box>
			<Box mbe='x6'>
				<strong>{title}</strong>
			</Box>
			<Box display='flex' justifyContent='stretch'>
				{subtitle}
			</Box>
		</Box>
	</Box>
);

export default FeatureModalBullets;

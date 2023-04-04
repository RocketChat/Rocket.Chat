import { Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement, ReactNode } from 'react';

type CardIconProps = { children: ReactNode } | ComponentProps<typeof Icon>;

const hasChildrenProp = (props: CardIconProps): props is { children: ReactNode } => 'children' in props;

const CardIcon = (props: CardIconProps): ReactElement => (
	<Box minWidth='x16' display='inline-flex' flexDirection='row' alignItems='flex-end' justifyContent='center'>
		{hasChildrenProp(props) ? props.children : <Icon size='x16' {...props} />}
	</Box>
);

export default CardIcon;

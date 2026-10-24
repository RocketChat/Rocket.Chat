import { styled, View } from '@tamagui/web';

import { labelBoxDefaults } from './Label';
import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { Icon, type IconProps } from '../Icon';

const LabelInfoFrame = styled(View, {
	render: 'span',
	...labelBoxDefaults,
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	order: 1,
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	marginInline: spacing('x4'),
});

export type LabelInfoProps = {
	title: string;
	id?: string;
} & Omit<IconProps, 'name'>;

export const LabelInfo = withFuselageProvider(({ title, id, ...props }: LabelInfoProps) => (
	<LabelInfoFrame className='rcx-label__info'>
		<span hidden id={id}>
			{title}
		</span>
		<Icon {...props} name='info-circled' title={title} />
	</LabelInfoFrame>
));

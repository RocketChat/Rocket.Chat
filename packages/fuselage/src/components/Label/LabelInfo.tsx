import { styled, View, type GetProps } from '@tamagui/web';

import { labelBoxDefaults } from './Label';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { BoxProps } from '../Box';
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
});

export type LabelInfoProps = {
	title: string;
	id?: string;
} & Omit<IconProps, 'name'>;

export const LabelInfo = withFuselageProvider(({ title, id, ...props }: LabelInfoProps) => {
	const frameProps = useTamaguiBoxProps<BoxProps>({ marginInline: 2 }, 'rcx-label__info');

	return (
		<LabelInfoFrame {...(frameProps as GetProps<typeof LabelInfoFrame>)}>
			<span hidden id={id}>
				{title}
			</span>
			<Icon {...props} name='info-circled' title={title} />
		</LabelInfoFrame>
	);
});

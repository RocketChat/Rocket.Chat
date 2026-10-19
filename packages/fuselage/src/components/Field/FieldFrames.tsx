import { styled, Text } from '@tamagui/web';

import { fontColor, fontScale, spacing } from '../../styleTokens';
import { labelBoxDefaults } from '../Label/Label';

const typography = (name: 'p2' | 'c1') => {
	const { fontSize, fontWeight, lineHeight, letterSpacing } = fontScale(name)!;
	return { fontSize, fontWeight: fontWeight as 400, lineHeight, letterSpacing };
};

export const FieldFrame = styled(Text, {
	render: 'div',
	...labelBoxDefaults,
	display: 'flex',
	flexDirection: 'column',
	flexWrap: 'nowrap',
	alignItems: 'stretch',
	flexShrink: 0,
	width: '100%',
});

export const FieldRowFrame = styled(Text, {
	render: 'span',
	...labelBoxDefaults,
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'nowrap',
	justifyContent: 'space-between',
	alignItems: 'center',
	marginBlockStart: spacing('x4'),
	marginBlockEnd: spacing('x2'),
	color: fontColor('secondary-info'),
});

export const FieldDescriptionFrame = styled(Text, {
	render: 'span',
	...labelBoxDefaults,
	...typography('p2'),
	marginBlock: spacing('x2'),
	color: fontColor('secondary-info'),
});

export const FieldHintFrame = styled(Text, {
	render: 'span',
	...labelBoxDefaults,
	...typography('c1'),
	marginBlock: spacing('x2'),
	color: fontColor('secondary-info'),
});

export const FieldErrorFrame = styled(Text, {
	render: 'span',
	...labelBoxDefaults,
	...typography('c1'),
	marginBlock: spacing('x2'),
	color: fontColor('danger'),
});

export const FieldLinkFrame = styled(Text, {
	render: 'a',
	...labelBoxDefaults,
	...typography('c1'),
	marginBlock: spacing('x2'),
	color: fontColor('info'),
});

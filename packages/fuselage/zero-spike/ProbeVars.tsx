// Custom properties set by a variant: the zero compiler drops them, with no diagnostic
import { styled, View } from '@tamagui/web';

const VarFrame = styled(View, {
	render: 'button',
	backgroundColor: { 'default': 'var(--bg, gray)', 'hover': 'var(--bg-hover, black)', 'focus-visible': 'var(--bg, gray)' },
	variants: {
		look: {
			primary: { '--bg': 'blue', '--bg-hover': 'navy' },
			danger: { '--bg': 'red', '--bg-hover': 'darkred' },
		},
		ghost: {
			primary: { '--ghost-bg': 'transparent' },
		},
	} as const,
});

type Props = { look?: 'primary' | 'danger'; ghost?: 'primary' };

export const V1 = ({ look, ghost }: Props) => (
	<VarFrame look={look} ghost={ghost}>
		v1
	</VarFrame>
);

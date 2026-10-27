import type { BoxProps } from '@rocket.chat/fuselage';
import { spacing as toSpacing } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';
import type { CSSProperties } from 'react';

type ListComponentProps = {
	color: NonNullable<CSSProperties['color']>;
	icon?: string;
	listStyleType: CSSProperties['listStyleType'];
	spacing: BoxProps['marginBlock'];
};

export const ListComponent = styled(
	'ul',
	({ color: _color, icon: _icon, listStyleType: _listStyleType, spacing: _spacing, ...props }: ListComponentProps) => props,
)`
	padding: 0;
	margin: 0;
	color: ${(p) => p.color};
	list-style: ${(p) => (p.icon ? `none url('data:image/svg+xml,${p.icon}') inside` : `${p.listStyleType || 'none'} inside`)};

	& > * {
		margin-block: ${(p) => toSpacing(p.spacing) ?? '0'};
	}
`;

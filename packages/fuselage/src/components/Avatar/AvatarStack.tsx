import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import flattenChildren from 'react-keyed-flatten-children';

import { prependClassName } from '../../helpers/prependClassName';

export type AvatarStackProps = DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

const AvatarStack = ({ children, ...props }: AvatarStackProps) => {
	props.className = prependClassName(props.className, 'rcx-avatar-stack');
	return <div {...props}>{flattenChildren(children).reverse()}</div>;
};

export default AvatarStack;

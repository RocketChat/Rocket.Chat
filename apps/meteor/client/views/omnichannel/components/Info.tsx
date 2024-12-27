import type { cssFn } from '@rocket.chat/css-in-js';
import { css } from '@rocket.chat/css-in-js';
import type { CSSProperties, ReactNode } from 'react';

import { UserCardInfo } from '../../../components/UserCard';

const wordBreak = css`
	word-break: break-word;
`;

type InfoProps = {
	className?: string | cssFn;
	style?: CSSProperties;
	children?: ReactNode;
};

const Info = ({ className, ...props }: InfoProps) => <UserCardInfo className={[className, wordBreak]} flexShrink={0} {...props} />;

export default Info;

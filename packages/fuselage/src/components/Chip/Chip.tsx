import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { prependClassName } from '../../helpers/prependClassName';
import { Avatar } from '../Avatar';
import { Box } from '../Box';
import { withBoxStyling } from '../Box/withBoxStyling';
import { Icon } from '../Icon';
import { Margins } from '../Margins';

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
	thumbUrl?: string;
	renderThumb?: (props: { url: string }) => ReactNode;
	renderDismissSymbol?: () => ReactNode;
};

const defaultRenderThumb = ({ url }: { url: string }) => (
	<Box rcx-avatar>
		<Avatar size='x20' url={url} />
	</Box>
);
const defaultRenderDismissSymbol = () => <Icon name='cross' size='x16' />;

const Chip = ({
	children,
	className,
	thumbUrl,
	onClick,
	onMouseDown,
	renderThumb = defaultRenderThumb,
	renderDismissSymbol = defaultRenderDismissSymbol,
	...rest
}: ChipProps) => {
	const dismissable = Boolean(onClick || onMouseDown);

	return (
		<button
			type='button'
			className={prependClassName(className, 'rcx-box rcx-chip')}
			disabled={!dismissable}
			onClick={onClick}
			onMouseDown={onMouseDown}
			{...rest}
		>
			<Margins all='x4'>
				{thumbUrl && renderThumb?.({ url: thumbUrl })}
				{children && <span className='rcx-box rcx-chip__text'>{children}</span>}
				{dismissable && renderDismissSymbol?.()}
			</Margins>
		</button>
	);
};

export default withBoxStyling(Chip);

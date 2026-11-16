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
	/** Renders a 20px tall chip. */
	small?: boolean;
	/** Renders the text in uppercase, for chips that categorize rather than select. */
	label?: boolean;
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
	small,
	label,
	...rest
}: ChipProps) => {
	const dismissable = Boolean(onClick || onMouseDown);

	return (
		<button
			type='button'
			className={prependClassName(className, `rcx-box rcx-chip${small ? ' rcx-chip--small' : ''}${label ? ' rcx-chip--label' : ''}`)}
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

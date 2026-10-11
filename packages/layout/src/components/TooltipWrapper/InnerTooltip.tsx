import type { TooltipProps } from '@rocket.chat/fuselage';
import { Tooltip } from '@rocket.chat/fuselage';
import type { Dispatch, RefObject, SetStateAction, RefAttributes } from 'react';

export type AnchorParams = {
	ref: RefObject<Element | null>;
	toggle: Dispatch<SetStateAction<boolean>>;
	id: string;
};

type InnerTooltipProps = Omit<TooltipProps, 'ref'> & RefAttributes<HTMLDivElement>;

const InnerTooltip = ({ ref, style, ...props }: InnerTooltipProps) => {
	return (
		<div ref={ref} style={style}>
			<Tooltip {...props} />
		</div>
	);
};

export default InnerTooltip;

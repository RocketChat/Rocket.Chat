import type { HTMLAttributes } from 'react';

export type SidepanelProps = HTMLAttributes<HTMLDivElement>;
// TODO: Make this a variation of the sidebar
/**
 * A panel beside the sidebar that lists the rooms of the filter or the team picked in it, under a header that names
 * the selection.
 */
const Sidepanel = ({ className, ...props }: SidepanelProps) => (
	<div className={['rcx-sidepanel', className].filter(Boolean).join(' ')} {...props} />
);

export default Sidepanel;

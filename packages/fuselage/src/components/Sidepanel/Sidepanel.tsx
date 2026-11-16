import type { HTMLAttributes } from 'react';

export type SidepanelProps = HTMLAttributes<HTMLDivElement>;
// TODO: Make this a variation of the sidebar
const Sidepanel = ({ className, ...props }: SidepanelProps) => (
	<div className={['rcx-sidepanel', className].filter(Boolean).join(' ')} {...props} />
);

export default Sidepanel;

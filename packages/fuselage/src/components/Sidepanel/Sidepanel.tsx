import type { HTMLAttributes } from 'react';

export type SidepanelProps = HTMLAttributes<HTMLDivElement>;

const Sidepanel = ({ className, ...props }: SidepanelProps) => (
	<div className={['rcx-sidepanel', className].filter(Boolean).join(' ')} {...props} />
);

export default Sidepanel;

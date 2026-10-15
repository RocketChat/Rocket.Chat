import type { ReactNode } from 'react';

export type OptionHeaderProps = {
	children: ReactNode;
};

const OptionHeader = ({ children }: OptionHeaderProps) => <div className='rcx-option__header'>{children}</div>;

export default OptionHeader;

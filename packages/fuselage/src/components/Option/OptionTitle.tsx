import type { ReactNode } from 'react';

export type OptionTitleProps = {
	children?: ReactNode;
};

const OptionTitle = (props: OptionTitleProps) => <div className='rcx-option__title' {...props} />;

export default OptionTitle;

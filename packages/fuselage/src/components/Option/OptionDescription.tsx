import type { ReactNode } from 'react';

export type OptionDescriptionProps = {
	children?: ReactNode;
};

const OptionDescription = (props: OptionDescriptionProps) => <div className='rcx-option__description' {...props} />;

export default OptionDescription;

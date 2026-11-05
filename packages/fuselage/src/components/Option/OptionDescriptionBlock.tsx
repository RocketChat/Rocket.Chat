import type { ReactNode } from 'react';

export type OptionDescriptionBlockProps = {
	children?: ReactNode;
};

const OptionDescriptionBlock = (props: OptionDescriptionBlockProps) => <div className='rcx-option__description-block' {...props} />;

export default OptionDescriptionBlock;

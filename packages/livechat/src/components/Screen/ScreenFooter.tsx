import { type ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';

import { Footer, FooterContent, PoweredBy } from '../Footer';
import { ScreenContext } from './ScreenProvider';

export type ScreenFooterProps = {
	children?: ComponentChildren;
	options?: ComponentChildren;
	limit?: ComponentChildren;
};

const ScreenFooter = ({ children, options, limit }: ScreenFooterProps) => {
	const { hideWatermark } = useContext(ScreenContext);

	return (
		<Footer>
			{children && <FooterContent>{children}</FooterContent>}
			<FooterContent>
				{options}
				{limit}
				{!hideWatermark && <PoweredBy />}
			</FooterContent>
		</Footer>
	);
};

export default ScreenFooter;

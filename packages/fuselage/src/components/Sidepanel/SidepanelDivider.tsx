import { css } from '@rocket.chat/css-in-js';

import { strokeColors } from '../../Theme';
import { useStyle } from '../../hooks/useStyle';
import { ItemDivider } from '../Item';

const lightStroke = css`
	--rcx-item-color-stroke-divider: ${strokeColors['stroke-light']};
`;

const SidepanelDivider = () => {
	const className = useStyle(lightStroke, undefined);

	return <ItemDivider role='separator' className={`rcx-sidepanel--divider ${className}`} />;
};

export default SidepanelDivider;

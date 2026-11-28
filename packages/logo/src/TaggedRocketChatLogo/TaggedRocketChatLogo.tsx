import colors from '@rocket.chat/fuselage-tokens/dist/colors.json' with { type: 'json' };
import type { HTMLAttributes } from 'react';

import { LogoContainer, LogoTag } from './TaggedRocketChatLogo.styles.js';
import RocketChatLogo from '../RocketChatLogo/index.js';

type TaggedRocketChatLogoProps = {
	tagTitle?: string;
	tagBackground?: string;
	color?: string;
} & HTMLAttributes<HTMLDivElement>;

const TaggedRocketChatLogo = ({ tagTitle, tagBackground = colors.r400, color = colors.white, ...props }: TaggedRocketChatLogoProps) => (
	<LogoContainer {...props}>
		<RocketChatLogo />
		{tagTitle && (
			<LogoTag backgroundColor={tagBackground} color={color}>
				{tagTitle}
			</LogoTag>
		)}
	</LogoContainer>
);

export default TaggedRocketChatLogo;

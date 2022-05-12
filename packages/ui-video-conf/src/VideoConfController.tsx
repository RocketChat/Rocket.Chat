import React from 'react';
import type { ReactElement, ButtonHTMLAttributes } from 'react';

import { Box, Button, Icon, ActionButton } from '@rocket.chat/fuselage';
import type { IconProps } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';

type VideoConfControllerProps = {
	icon: IconProps['name'];
	primary?: boolean;
	text: string;
} & Omit<ButtonHTMLAttributes<HTMLElement>, 'ref' | 'is' | 'className' | 'size' | 'elevation'>;

const VideoConfController = ({ primary, text, icon, ...props }: VideoConfControllerProps): ReactElement => {
  const id = useUniqueId();

  return <ActionButton icon={icon} id={id} square primary={primary} {...props} />
}

export default VideoConfController;

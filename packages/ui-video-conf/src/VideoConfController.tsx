import React from 'react';
import type { ReactElement, ButtonHTMLAttributes } from 'react';

import { IconButton } from '@rocket.chat/fuselage';
import type { IconProps } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';

type VideoConfControllerProps = {
	icon: IconProps['name'];
	active?: boolean;
	text: string;
} & Omit<ButtonHTMLAttributes<HTMLElement>, 'ref' | 'is' | 'className' | 'size' | 'elevation'>;

const VideoConfController = ({ active, text, icon, ...props }: VideoConfControllerProps): ReactElement => {
  const id = useUniqueId();

  return <IconButton icon={icon} id={id} info={active} square secondary {...props} />
}

export default VideoConfController;

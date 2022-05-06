import React from 'react';
import type { ReactNode, ReactElement, ButtonHTMLAttributes } from 'react';

import { Box, Button, Icon } from '@rocket.chat/fuselage';
import type { IconProps } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';

type VideoConfControllerProps = {
	icon: IconProps['name'];
	primary?: boolean;
	text: string;
} & Omit<ButtonHTMLAttributes<HTMLElement>, 'ref' | 'is' | 'className' | 'size' | 'elevation'>;

const VideoConfController = ({ primary, text, icon, ...props }: VideoConfControllerProps): ReactElement => {
  const id = useUniqueId();

  return (
    <Box display='flex' flexDirection='column' alignItems='center' mie='x12'>
      <Button id={id} square primary={primary} {...props}>
        <Icon size='x20' name={icon} />
      </Button>
      <Box is='label' htmlFor={id} mbs='x8' fontScale='c1' color='neutral-700' {...props}>
        {text}
      </Box>
    </Box>
  );
}

export default VideoConfController;

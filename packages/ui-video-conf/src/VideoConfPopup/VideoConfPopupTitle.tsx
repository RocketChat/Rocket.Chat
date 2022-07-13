import React from 'react';
import type { ComponentProps } from 'react';
import { Box, Icon, Throbber } from '@rocket.chat/fuselage';

type VideoConfPopupTitleProps = {
  text: string;
  counter?: boolean; 
  icon?: ComponentProps<typeof Icon>['name'];
};

const VideoConfPopupTitle = ({ text, counter = false, icon }: VideoConfPopupTitleProps) => {
  return (
    <Box mbs='x8' display='flex' alignItems='center'>
      {icon && <Icon size='x20' name={icon} />}
      <Box mis='x4' fontScale='p1b'>
        {text} 
      </Box>
      {counter && <Throbber size='x8' mis='x4' inheritColor />}
    </Box>
  );
}

export default VideoConfPopupTitle;

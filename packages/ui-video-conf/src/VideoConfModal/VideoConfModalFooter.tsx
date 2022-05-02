import React from 'react';
import type { ReactNode, ReactElement } from 'react';
import { ButtonGroup } from '@rocket.chat/fuselage';

const VideoConfModalFooter = ({ children }: { children: ReactNode }): ReactElement => {
  return (
    <ButtonGroup m='x32' mbs='x24' vertical stretch>
      {children}
    </ButtonGroup>
  );
}

export default VideoConfModalFooter;

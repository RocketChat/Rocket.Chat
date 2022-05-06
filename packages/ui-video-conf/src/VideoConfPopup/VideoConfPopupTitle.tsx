import React, { useEffect, useState, ComponentProps } from 'react';
import { Box, Icon } from '@rocket.chat/fuselage';

const VideoConfPopupTitle = ({ text, counter, icon }: { text: string; counter: boolean; icon: ComponentProps<typeof Icon>['name'] }) => {
  const [dots, setDots] = useState(['.']);

  useEffect(() => {
    if (counter) {
      const dotsInterval = setInterval(() => {
        setDots((prevState) => {
          if (prevState.length === 3) {
            return ['.'];
          }
  
          return ([...prevState, '.'])
        });
      }, 1000);

      return () => clearInterval(dotsInterval);
    }
  }, []);

  return (
    <Box mbs='x8' display='flex' alignItems='center'>
      <Icon size='x20' name={icon} />
      <Box mis='x4' fontScale='p1b'>
        {text} {dots}
      </Box>
    </Box>
  );
}

export default VideoConfPopupTitle;

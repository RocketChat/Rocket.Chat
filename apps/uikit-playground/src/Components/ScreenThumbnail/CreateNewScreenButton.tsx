import { css } from '@rocket.chat/css-in-js';
import { Icon, Box } from '@rocket.chat/fuselage';
import { ComponentProps } from 'react';

const CreateNewScreenButton = ({
  size = '60px',
  name = 'plus',
  ...props
}: {
  size?: ComponentProps<typeof Icon>['size'];
} & ComponentProps<typeof Icon>) => {
  return (
    <Box width={size} height={size}>
      <Icon
        {...props}
        size={size}
        name={name}
        className={css`
          cursor: pointer;
          transition: var(--animation-default);
          &:hover {
            scale: 1.1;
            transition: var(--animation-default);
          }
        `}
      />
    </Box>
  );
};

export default CreateNewScreenButton;

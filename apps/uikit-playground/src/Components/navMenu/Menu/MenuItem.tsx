import { css } from '@rocket.chat/css-in-js';
import { Box, Label } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';

const MenuItem: FC<{ name: string } & ComponentProps<typeof Box>> = ({
  name,
  ...props
}) => {
  const pointer = css`
    cursor: pointer;
  `;

  const style = css`
    &:hover {
      background-color: #1f2329;
    }
    &:active {
      background-color: #6c727a;
      opacity: 0.3;
    }
  `;
  return (
    <Box
      width="100%"
      height="28px"
      paddingBlock="4px"
      display="flex"
      alignItems="center"
      className={[pointer, style]}
      {...props}
    >
      <Label className={pointer} color="hint" fontScale="p2">
        {name}
      </Label>
    </Box>
  );
};

export default MenuItem;

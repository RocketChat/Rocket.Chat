import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';

const ElementWrapper = ({
  children,
}: {
  children: ReactNode,
}): ReactElement => (
  <Box
    children={children}
    className={css`
      position: relative;
      box-sizing: border-box;
      outline: 1px solid transparent;
      height: fit-content;
      padding: 0 8px;
      align-items: center;
      transition: var(--animation-fast);
      &:hover {
        padding: 8px;
        border-radius: 4px;
        outline: var(--elements-border);
        transition: var(--animation-fast);
        box-shadow: 0px 0px 8px 1px #ddd;

        > .closeBtn {
          visibility: visible !important;
        }
      }
      &:active {
        padding: 8px;
        background-color: #fff;
        outline: var(--elements-border);
        box-shadow: 0px 0px 8px 1px #ddd;
      }
    `}
  />
);

export default ElementWrapper;

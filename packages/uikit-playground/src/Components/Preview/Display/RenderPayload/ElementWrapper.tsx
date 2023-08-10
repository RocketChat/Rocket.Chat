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
      align-items: center;
      transition: var(--animation-fast);
      padding: 0px 8px;

      &:hover {
        border-radius: 4px;
        padding: 8px;
        outline: var(--elements-border);
        transition: var(--animation-fast);
        box-shadow: 0px 0px 8px 1px #ddd;

        > .closeBtn {
          visibility: visible !important;
        }
      }

      &:active {
        background-color: #fff;
        padding: 8px;
        transition: var(--animation-fast);
        outline: var(--elements-border);
        box-shadow: 0px 0px 8px 1px #ddd;
      }
    `}
  />
);

export default ElementWrapper;

import { css } from '@rocket.chat/css-in-js';
import { Tabs } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { useContext } from 'react';

import { context, tabsToggleAction } from '../../../Context';

const TabChange: FC<{ tabsItem: string[] }> = ({ tabsItem }) => {
  const {
    state: { tabsToggle },
    dispatch,
  } = useContext(context);

  const disableBorder = css`
    border-left: none !important;
    border-right: none !important;
    border-top: none !important;
    box-shadow: none !important;
    margin-right: 0 !important;
  `;
  return (
    <Tabs>
      {tabsItem.map((item: string, index: number) => (
        <Tabs.Item
          key={index}
          selected={tabsToggle === index}
          onClick={() => dispatch(tabsToggleAction(index))}
          className={disableBorder}
          children={item}
        />
      ))}
    </Tabs>
  );
};

export default TabChange;

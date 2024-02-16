import type { IUser } from '@rocket.chat/core-typings';
import { Option, OptionDescription } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ReactElement } from 'react';

type MulitUserSelectOptionProps = {
  label: Pick<IUser, 'username' | 'name'>;
};

const MulitUserSelectOption = ({
  label,
  ...props
}: MulitUserSelectOptionProps): ReactElement => {
  const { name, username } = label;

  return (
    <Option
      {...props}
      data-qa-type='autocomplete-user-option'
      avatar={<UserAvatar username={username || ''} size='x20' />}
      key={username}
      label={
        (
          <>
            {name || username}{' '}
            <OptionDescription>({username})</OptionDescription>
          </>
        ) as any
      }
      children={undefined}
    />
  );
};

export default MulitUserSelectOption;

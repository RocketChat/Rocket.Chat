import type { IUser } from '@rocket.chat/core-typings';
import { Option, OptionDescription } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

type UserAutoCompleteMultipleOptionProps = {
  label: {
    _federated?: boolean;
  } & Pick<IUser, 'username' | 'name'>;
};

const UserAutoCompleteMultipleOption = ({
  label,
  ...props
}: UserAutoCompleteMultipleOptionProps): ReactElement => {
  const { name, username, _federated } = label;

  return (
    <Option
      {...props}
      data-qa-type='autocomplete-user-option'
      icon={_federated ? 'globe' : undefined}
      key={username}
      label={
        (
          <>
            {name || username}{' '}
            {!_federated && <OptionDescription>({username})</OptionDescription>}
          </>
        ) as any
      }
      children={undefined}
    />
  );
};

export default UserAutoCompleteMultipleOption;

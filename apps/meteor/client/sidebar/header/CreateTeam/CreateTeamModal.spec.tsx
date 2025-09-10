import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Under test
import CreateTeamModal from './CreateTeamModal';

// Mocks for Rocket.Chat UI contexts and utilities
jest.mock('@rocket.chat/ui-contexts', () => {
  return {
    // hooks used by the component
    useTranslation: () => ((key: string, vars?: any) => {
      if (vars && typeof vars === 'object') {
        return `${key} ${JSON.stringify(vars)}`;
      }
      return key;
    }),
    useSetting: jest.fn((key: string) => {
      const defaults: Record<string, any> = {
        E2E_Enable: true,
        E2E_Enabled_Default_PrivateRooms: true,
        UTF8_Channel_Names_Validation: '[0-9a-zA-Z-_.]+',
        UI_Allow_room_names_with_special_chars: false,
      };
      return defaults[key];
    }),
    usePermission: jest.fn((perm: string) => {
      if (perm === 'create-team') return true;
      return true;
    }),
    usePermissionWithScopedRoles: jest.fn(() => true),
    useEndpoint: jest.fn((method: string, path: string) => {
      if (method === 'GET' && path === '/v1/rooms.nameExists') {
        return jest.fn(async ({ roomName }: { roomName: string }) => {
          // Simulate nameExists endpoint: "existing-team" collides; otherwise free
          return { exists: roomName === 'existing-team' };
        });
      }
      if (method === 'POST' && path === '/v1/teams.create') {
        return jest.fn(async () => ({ team: { roomId: 'GENERAL' } }));
      }
      return jest.fn();
    }),
    useToastMessageDispatch: jest.fn(() => jest.fn()),
  };
});

jest.mock('../../../lib/utils/goToRoomById', () => ({
  goToRoomById: jest.fn(),
}));

// Silence Fuselage heavy components for test speed; render minimal structure
jest.mock('@rocket.chat/fuselage', () => {
  const React = require('react');
  return {
    // Simple pass-through components
    Box: (p: any) => <div {...p} />,
    Button: (p: any) => <button {...p} />,
    Field: (p: any) => <div {...p} />,
    FieldGroup: (p: any) => <div {...p} />,
    FieldLabel: (p: any) => <label {...p} />,
    FieldRow: (p: any) => <div {...p} />,
    FieldError: (p: any) => <div role="alert" {...p} />,
    FieldDescription: (p: any) => <div {...p} />,
    FieldHint: (p: any) => <div {...p} />,
    Icon: (p: any) => <span data-icon={p.name} />,
    TextInput: ({ addon, error, ...rest }: any) => (
      <div>
        {addon}
        <input {...rest} />
        {error ? <div data-testid="input-error">{error}</div> : null}
      </div>
    ),
    ToggleSwitch: ({ checked, onChange, disabled, id, ...rest }: any) => (
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        {...rest}
      />
    ),
    Accordion: (p: any) => <div {...p} />,
    AccordionItem: ({ title, children }: any) => (
      <section>
        <h3>{title}</h3>
        <div>{children}</div>
      </section>
    ),
    Modal: ({ wrapperFunction, children, ...rest }: any) => {
      const Wrapper = wrapperFunction || (({ children: c, ...r }: any) => <div {...r}>{c}</div>);
      return <Wrapper data-testid="modal" {...rest}>{children}</Wrapper>;
    },
    ModalHeader: (p: any) => <header {...p} />,
    ModalTitle: (p: any) => <h2 {...p} />,
    ModalClose: (p: any) => <button aria-label="close" {...p} />,
    ModalContent: (p: any) => <div {...p} />,
    ModalFooter: (p: any) => <footer {...p} />,
    ModalFooterControllers: (p: any) => <div {...p} />,
  };
});

// Mock UserAutoCompleteMultiple to a simple multi-select
jest.mock('../../../components/UserAutoCompleteMultiple', () => {
  const React = require('react');
  return function UserAutoCompleteMultiple({ id, value = [], onChange, placeholder }: any) {
    return (
      <select data-testid="members" id={id} multiple value={value} onChange={(e) => {
        const selected = Array.from(e.target.selectedOptions).map((o: any) => o.value);
        onChange(selected);
      }}>
        <option value="user1">user1</option>
        <option value="user2">user2</option>
      </select>
    );
  };
});

// Mock hook providing encrypted hint
jest.mock('../hooks/useEncryptedRoomDescription', () => ({
  useEncryptedRoomDescription: () => (roomType: 'team') => ({ isPrivate, encrypted }: { isPrivate: boolean; encrypted: boolean }) =>
    `hint(${roomType}): private=${isPrivate}, encrypted=${encrypted}`,
}));

// Utilities
const getCreateButton = () => screen.getByRole('button', { name: /Create/i });
const getCancelButton = () => screen.getByRole('button', { name: /Cancel/i });

describe('CreateTeamModal', () => {
  it('renders with defaults and enables Create when permission allows', () => {
    render(<CreateTeamModal onClose={jest.fn()} />);
    expect(screen.getByTestId('modal')).toBeInTheDocument();

    // Create is enabled by default (permission mocked to true)
    expect(getCreateButton()).toBeEnabled();

    // Name field present with team icon addon via data-icon attribute
    const nameInput = screen.getByRole('textbox', { name: /Teams_New_Name_Label/i });
    expect(nameInput).toHaveAttribute('aria-required', 'true');
  });

  it('validates name: required and disallows special characters when setting requires', async () => {
    const user = userEvent.setup();
    render(<CreateTeamModal onClose={jest.fn()} />);

    // Attempt submit with empty name triggers required error
    await user.click(getCreateButton());
    const nameError = await screen.findByRole('alert');
    expect(nameError).toHaveTextContent(/Required_field/);

    // Enter invalid name with spaces triggers special chars error
    const nameInput = screen.getByRole('textbox', { name: /Teams_New_Name_Label/i });
    await user.type(nameInput, 'invalid name with spaces');
    // trigger blur/validation
    nameInput.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    expect(await screen.findByText(/Name_cannot_have_special_characters/)).toBeInTheDocument();
  });

  it('validates name: shows "already exists" message when rooms.nameExists returns exists=true', async () => {
    const user = userEvent.setup();
    render(<CreateTeamModal onClose={jest.fn()} />);

    const input = screen.getByRole('textbox', { name: /Teams_New_Name_Label/i });
    await user.clear(input);
    await user.type(input, 'existing-team');
    input.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

    expect(await screen.findByText(/Teams_Errors_Already_exists/)).toBeInTheDocument();
  });

  it('toggles private and updates encrypted availability and hint text appropriately', async () => {
    const user = userEvent.setup();
    render(<CreateTeamModal onClose={jest.fn()} />);

    // Encrypted switch should be enabled since isPrivate default true and E2E enabled
    const encryptedSwitch = screen.getByRole('switch', { name: /Teams_New_Encrypted_Label/i });
    expect(encryptedSwitch).toBeEnabled();
    expect(encryptedSwitch).toBeChecked();

    // Private description reflects "People can only join by being invited"
    expect(screen.getByText(/People_can_only_join_by_being_invited/)).toBeInTheDocument();

    // Turn off private; encrypted becomes unchecked and disabled (by effect)
    const privateSwitch = screen.getByRole('switch', { name: /Teams_New_Private_Label/i });
    await user.click(privateSwitch); // set to false
    await waitFor(() => {
      expect(encryptedSwitch).toBeDisabled();
      expect(encryptedSwitch).not.toBeChecked();
    });
    // Description updates
    expect(screen.getByText(/Anyone_can_access/)).toBeInTheDocument();
  });

  it('broadcast forces readOnly and shows description accordingly; readOnly disabled when broadcast on', async () => {
    const user = userEvent.setup();
    render(<CreateTeamModal onClose={jest.fn()} />);

    const broadcastSwitch = screen.getByRole('switch', { name: /Teams_New_Broadcast_Label/i });
    const readOnlySwitch = screen.getByRole('switch', { name: /Teams_New_Read_only_Label/i });

    // Toggle broadcast on
    await user.click(broadcastSwitch);
    await waitFor(() => {
      expect(readOnlySwitch).toBeDisabled();
      expect(readOnlySwitch).toBeChecked(); // readOnly mirrors broadcast (true)
    });

    // Description when readOnly true
    expect(screen.getByText(/Read_only_field_hint_enabled/)).toBeInTheDocument();

    // Broadcast description appears
    expect(screen.getByText(/Teams_New_Broadcast_Description/)).toBeInTheDocument();
  });

  it('successful submission creates team, shows success toast, navigates to room, and closes modal', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    const { useEndpoint, useToastMessageDispatch } = jest.requireMock('@rocket.chat/ui-contexts') as any;
    const toastSpy = jest.fn();
    (useToastMessageDispatch as jest.Mock).mockReturnValue(toastSpy);

    // Ensure POST /v1/teams.create returns roomId 'GENERAL' (as mocked above)
    render(<CreateTeamModal onClose={onClose} />);

    const nameInput = screen.getByRole('textbox', { name: /Teams_New_Name_Label/i });
    await user.clear(nameInput);
    await user.type(nameInput, 'new-team');

    await user.click(getCreateButton());

    // Verify navigation called
    const { goToRoomById } = jest.requireMock('../../../lib/utils/goToRoomById') as any;
    await waitFor(() => {
      expect(goToRoomById).toHaveBeenCalledWith('GENERAL');
      expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('failure path: shows error toast and still closes modal', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    const { useEndpoint, useToastMessageDispatch } = jest.requireMock('@rocket.chat/ui-contexts') as any;

    // Mock create endpoint to throw
    (useEndpoint as jest.Mock).mockImplementation((method: string, path: string) => {
      if (method === 'GET' && path === '/v1/rooms.nameExists') {
        return jest.fn(async () => ({ exists: false }));
      }
      if (method === 'POST' && path === '/v1/teams.create') {
        return jest.fn(async () => {
          throw new Error('boom');
        });
      }
      return jest.fn();
    });

    const toastSpy = jest.fn();
    (useToastMessageDispatch as jest.Mock).mockReturnValue(toastSpy);

    render(<CreateTeamModal onClose={onClose} />);

    const nameInput = screen.getByRole('textbox', { name: /Teams_New_Name_Label/i });
    await user.clear(nameInput);
    await user.type(nameInput, 'will-fail');

    await user.click(getCreateButton());

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('disables Create button when user cannot create teams', async () => {
    const { usePermission } = jest.requireMock('@rocket.chat/ui-contexts') as any;
    (usePermission as jest.Mock).mockImplementation((perm: string) => perm !== 'create-team' ? true : false);

    render(<CreateTeamModal onClose={jest.fn()} />);
    expect(getCreateButton()).toBeDisabled();
  });

  it('respects canOnlyCreateOneType from useCreateChannelTypePermission: forces private true and disables its switch', async () => {
    // Override the hook module to simulate only 'p' allowed
    jest.doMock('../../../hooks/useCreateChannelTypePermission', () => ({
      useCreateChannelTypePermission: () => 'p',
    }));
    // Re-require component after mocking dependency
    const RewiredCreateTeamModal = (await import('./CreateTeamModal')).default;

    render(<RewiredCreateTeamModal onClose={jest.fn()} />);

    const privateSwitch = screen.getByRole('switch', { name: /Teams_New_Private_Label/i });
    expect(privateSwitch).toBeDisabled();
    expect(privateSwitch).toBeChecked();
  });
});
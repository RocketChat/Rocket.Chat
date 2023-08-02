import { useUiKitContext } from './useUiKitContext';

export const useUiKitStateValue = <
  T extends string | string[] | number | undefined
>(
  actionId: string,
  initialValue: T
): {
  value: T;
  error: string | undefined;
} => {
  const { values, errors } = useUiKitContext();

  return {
    value: (values && (values[actionId]?.value as T)) ?? initialValue,
    error: errors?.[actionId],
  };
};

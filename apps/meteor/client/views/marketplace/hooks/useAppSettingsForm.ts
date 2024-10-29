import type { SettingValue } from '@rocket.chat/core-typings';
import { useForm, useFormContext } from 'react-hook-form';

export const useAppSettingsForm = () => useForm<Record<string, SettingValue>>();

export const useAppSettingsFormContext = () => useFormContext<Record<string, SettingValue>>();

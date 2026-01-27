import { Box, Select, TextInput, Icon } from '@rocket.chat/fuselage';
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';
import React, { useEffect, useState } from 'react';
import { countries } from './countries';

const phoneUtil = PhoneNumberUtil.getInstance();

type PhoneNumberInputProps = {
    value: string;
    onChange: (value: string) => void;
    onValidityChange?: (isValid: boolean) => void;
    error?: string;
    disabled?: boolean;
    name?: string;
    id?: string;
};

const countryOptions: [string, string][] = countries.map((c) => [c.code, `${c.name} (${c.dialCode})`]);

const PhoneNumberInput = ({ value, onChange, onValidityChange, error, disabled, name, id }: PhoneNumberInputProps) => {
    const [countryCode, setCountryCode] = useState('US');
    const [localNumber, setLocalNumber] = useState('');

    // Initialize from external value
    useEffect(() => {
        if (!value) {
            setLocalNumber('');
            return;
        }
        try {
            // Check if value starts with +
            if (value.startsWith('+')) {
                const parsed = phoneUtil.parse(value);
                const region = phoneUtil.getRegionCodeForNumber(parsed);
                if (region) {
                    setCountryCode(region);
                    // Remove country code from display if valid
                    // But parsing national number is tricky.
                    // phoneUtil.format(parsed, PhoneNumberFormat.NATIONAL) usually works
                    setLocalNumber(phoneUtil.format(parsed, PhoneNumberFormat.NATIONAL));
                    return;
                }
            }
            setLocalNumber(value);
        } catch (e) {
            setLocalNumber(value);
        }
    }, [value]);

    const handleCountryChange = (newCountry: string) => {
        setCountryCode(newCountry);
        updateValue(localNumber, newCountry);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.currentTarget.value;
        setLocalNumber(newVal);
        updateValue(newVal, countryCode);
    };

    const updateValue = (number: string, country: string) => {
        if (!number) {
            onChange('');
            onValidityChange?.(true);
            return;
        }
        try {
            const parsed = phoneUtil.parse(number, country);
            const isValid = phoneUtil.isValidNumber(parsed);
            const isPossible = phoneUtil.isPossibleNumber(parsed);
            if (isValid || isPossible) {
                // Normalize common inputs like 1231231234 into E.164 (e.g., +11231231234).
                onChange(phoneUtil.format(parsed, PhoneNumberFormat.E164));
                onValidityChange?.(true);
            } else {
                // Keep the raw input so the form doesn't silently clear and unset phone on save.
                // Submit handlers should block when isValid = false.
                onChange(number);
                onValidityChange?.(false);
            }
        } catch {
            // Parse failed; keep raw input but mark invalid to prevent saving.
            onChange(number);
            onValidityChange?.(false);
        }
    };

    return (
        <Box display='flex' width='100%'>
            <Box width='auto' minWidth='x120' maxWidth='50%' flexShrink={0} mie='x4'>
                <Select
                    options={countryOptions}
                    value={countryCode}
                    onChange={(val) => handleCountryChange(String(val))}
                    disabled={disabled}
                    placeholder="Country"
                />
            </Box>
            <Box flexGrow={1}>
                <TextInput
                    value={localNumber}
                    onChange={handleNumberChange}
                    error={error}
                    disabled={disabled}
                    placeholder="(555) 555-5555"
                    addon={<Icon name='phone' size='x20' />}
                    name={name}
                    id={id}
                />
            </Box>
        </Box>
    );
};

export default PhoneNumberInput;

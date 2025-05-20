import React, { ChangeEvent, useCallback } from 'react';
import { InputBox } from '@rocket.chat/fuselage';

type TimeInputProps = {
    value: string;
    onChange: (value: string) => void;
};

const TimeInput = ({ value, onChange }: TimeInputProps) => {

    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        onChange(event.currentTarget.value);
    }, [onChange]);

    return (
        <InputBox 
            type='time' 
            value={value} 
            onChange={handleChange} 
        />
    );
};

export default TimeInput;

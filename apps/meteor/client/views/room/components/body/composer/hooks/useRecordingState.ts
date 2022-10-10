import { useState } from 'react';

export const useRecordingState = () => useState<'idle' | 'loading' | 'recording'>('idle');

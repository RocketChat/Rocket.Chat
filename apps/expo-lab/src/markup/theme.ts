import { Platform, type TextStyle } from 'react-native';

// Values of the Fuselage message body frame (14/20, neutral-900) and its link, code and highlight colors
export const body: TextStyle = { fontSize: 14, lineHeight: 20, color: '#2f343d' };
export const mono = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
export const colors = {
	link: '#095ad2',
	codeBg: '#f2f3f5',
	codeBorder: '#e4e7ea',
	quoteBar: '#cbced1',
	muted: '#6c727a',
	mention: '#095ad2',
	mentionBg: '#e8f2ff',
};
export const headingSize = { 1: 28, 2: 24, 3: 20, 4: 16 } as const;

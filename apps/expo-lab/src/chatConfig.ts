// EXPO_PUBLIC_CHAT_UI=plain selects the React Native-only screens; anything else the Fuselage ones
export const fuselageUi = process.env.EXPO_PUBLIC_CHAT_UI !== 'plain';

// Dev only: EXPO_PUBLIC_CHAT_MOCK=1 feeds invented rooms and messages to the screens, no network;
// =rooms or =room also starts on that screen, since the simulator has no touch tool
const mockValue = process.env.EXPO_PUBLIC_CHAT_MOCK;
export const mock = !!mockValue && mockValue !== '0';
export const mockStart = mockValue === 'rooms' || mockValue === 'room' ? mockValue : undefined;

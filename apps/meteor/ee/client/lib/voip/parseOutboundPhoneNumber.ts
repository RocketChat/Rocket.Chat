export const parseOutboundPhoneNumber = (phoneNumber: string): string => (phoneNumber ? phoneNumber.replace(/\*/g, '+') : '');

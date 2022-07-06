export const parseOutboundPhoneNumber = (phoneNumber: string): string => phoneNumber.replace(/\*/g, '+');

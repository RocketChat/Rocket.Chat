export const getUserEmailAddress = (user) => user.emails?.find(({ address }) => !!address)?.address;

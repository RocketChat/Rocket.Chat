const colors = ['#158D65', '#7F1B9F', '#B68D00', '#E26D0E', '#10529E', '#6C727A'];

export const getAvatarColor = (name: string): string => colors[name.length % colors.length];

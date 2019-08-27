export const getNameAndDomain = (fullyQualifiedName) => fullyQualifiedName.split('@');
export const isFullyQualified = (name) => name.indexOf('@') !== -1;

export const validateEmail = (email: string, options: { style: string } = { style: 'rfc' }): boolean => {
    const rfcEmailRegex =
        /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9-]{2,})+$/;

    return rfcEmailRegex.test(email);
};

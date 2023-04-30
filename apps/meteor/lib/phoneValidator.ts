export const validatePhone = (phone: string): boolean => {
    const rfcPhoneRegex =/^[+]?[\s./0-9]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/g;
       
          return rfcPhoneRegex.test(phone);
};


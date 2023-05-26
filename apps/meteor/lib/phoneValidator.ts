export const validatePhone = (phone: string): boolean => {
    const regex = /^[+]?[\s./0-9]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/g;
       
          return regex.test(phone);
};


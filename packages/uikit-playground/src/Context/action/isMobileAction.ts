type action = {
  type: string,
  payload: boolean,
};

export const isMobileAction = (payload: boolean): action => ({
  type: 'isMobile',
  payload,
});

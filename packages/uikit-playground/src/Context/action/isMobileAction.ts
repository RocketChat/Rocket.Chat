type action = {
  type: 'isMobile';
  payload: boolean;
};

export const isMobileAction = (payload: boolean): action => ({
  type: 'isMobile',
  payload,
});

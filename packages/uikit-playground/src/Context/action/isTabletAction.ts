type action = {
  type: 'isTablet';
  payload: boolean;
};

export const isTabletAction = (payload: boolean): action => ({
  type: 'isTablet',
  payload,
});

type action = {
  type: string,
  payload: boolean,
};

export const isTabletAction = (payload: boolean): action => ({
  type: 'isTablet',
  payload,
});

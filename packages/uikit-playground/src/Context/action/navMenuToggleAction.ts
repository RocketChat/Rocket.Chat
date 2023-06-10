type action = {
  type: string,
  payload: boolean,
};

export const navMenuToggleAction = (payload: boolean): action => ({
  type: 'navMenuToggle',
  payload,
});

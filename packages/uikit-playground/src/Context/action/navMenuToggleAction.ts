type action = {
  type: 'navMenuToggle';
  payload: boolean;
};

export const navMenuToggleAction = (payload: boolean): action => ({
  type: 'navMenuToggle',
  payload,
});

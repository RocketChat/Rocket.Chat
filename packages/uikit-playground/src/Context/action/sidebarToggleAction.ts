type action = {
  type: string,
  payload: boolean,
};

export const sidebarToggleAction = (payload: boolean): action => ({
  type: 'sidebarToggle',
  payload,
});

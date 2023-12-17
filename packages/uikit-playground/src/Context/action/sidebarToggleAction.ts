type action = {
  type: 'sidebarToggle';
  payload: boolean;
};

export const sidebarToggleAction = (payload: boolean): action => ({
  type: 'sidebarToggle',
  payload,
});

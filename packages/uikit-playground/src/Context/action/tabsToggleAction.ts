type action = {
  type: 'editorToggle';
  payload: number;
};

export const tabsToggleAction = (payload: number): action => ({
  type: 'editorToggle',
  payload,
});

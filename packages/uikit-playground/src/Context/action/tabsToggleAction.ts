type action = {
  type: string,
  payload: number,
};

export const tabsToggleAction = (payload: number): action => ({
  type: 'editorToggle',
  payload,
});

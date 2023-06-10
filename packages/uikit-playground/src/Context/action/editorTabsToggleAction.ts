type action = {
  type: string,
  payload: number,
};

export const editorTabsToggleAction = (payload: number): action => ({
  type: 'editorToggle',
  payload,
});

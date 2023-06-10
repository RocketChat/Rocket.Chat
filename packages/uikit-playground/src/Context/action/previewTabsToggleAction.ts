type action = {
  type: string,
  payload: number,
};

export const previewTabsToggleAction = (payload: number): action => ({
  type: 'previewToggle',
  payload,
});

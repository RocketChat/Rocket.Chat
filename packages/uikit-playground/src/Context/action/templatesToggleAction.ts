type action = {
  type: string,
  payload: boolean,
};

export const templatesToggleAction = (payload: boolean): action => ({
  type: 'templatesToggle',
  payload,
});

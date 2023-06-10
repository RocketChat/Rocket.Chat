type action = {
  type: string,
  payload: boolean,
};

export const openCreateNewScreenAction = (payload: boolean): action => ({
  type: 'openCreateNewScreen',
  payload,
});

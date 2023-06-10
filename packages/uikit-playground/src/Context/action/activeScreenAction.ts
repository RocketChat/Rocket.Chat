type action = {
  type: string,
  payload: string,
};

export const activeScreenAction = (payload: string): action => ({
  type: 'activeScreen',
  payload,
});

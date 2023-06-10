type action = {
  type: string,
  payload: string,
};

export const deleteScreenAction = (payload: string): action => ({
  type: 'deleteScreen',
  payload,
});

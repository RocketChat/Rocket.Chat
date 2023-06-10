type action = {
  type: string,
  payload: { id: string, name?: string },
};

export const duplicateScreenAction = (payload: {
  id: string,
  name?: string,
}): action => ({
  type: 'duplicateScreen',
  payload,
});

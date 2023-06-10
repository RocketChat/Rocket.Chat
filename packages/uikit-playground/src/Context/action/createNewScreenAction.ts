type action = {
  type: string,
  payload?: string,
};

export const createNewScreenAction = (payload?: string): action => ({
  type: 'createNewScreen',
  payload,
});

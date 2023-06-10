type action = {
  type: string,
  payload: number,
};

export const surfaceAction = (payload: number): action => ({
  type: 'surface',
  payload,
});

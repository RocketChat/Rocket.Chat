type action = {
  type: 'surface';
  payload: number;
};

export const surfaceAction = (payload: number): action => ({
  type: 'surface',
  payload,
});

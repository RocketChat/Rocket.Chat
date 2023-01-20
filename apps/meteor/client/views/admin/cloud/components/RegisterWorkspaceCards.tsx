import React from 'react';
import { Grid } from '@rocket.chat/fuselage';
import { Card } from '@rocket.chat/ui-client';
import useFeatureBullets from '../hooks/useFeatureBullets';

const RegisterWorkspaceCards = () => {
  const bulletFeatures = useFeatureBullets();

  return (
    <Grid mbs={16}>
      {
        bulletFeatures.map(card => (
          <Grid.Item key={card.key} xs={4} sm={4} md={4} lg={4} xl={3}>
            <Card variant='light'>
              <Card.Title>{card.title}</Card.Title>
              <Card.Body height='x88'>
                {card.description}
              </Card.Body>
            </Card>
          </Grid.Item>
        ))
      }
    </Grid>
  )
}

export default RegisterWorkspaceCards;

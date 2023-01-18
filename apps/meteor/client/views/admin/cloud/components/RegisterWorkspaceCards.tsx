import { Grid } from '@rocket.chat/fuselage';
import { Card } from '@rocket.chat/ui-client';
import React from 'react';

const cardsInfo = [
  {
    key: 1,
    title: 'Marketplace',
    description: 'Install Rocket.Chat Marketplace apps on this workspace.',
  },
  {
    key: 2,
    title: 'Mobile push notifications',
    description: 'Allow workspace members to receive notifications on their mobile devices.',
  },
  {
    key: 3,
    title: 'Omnichannel',
    description: 'Talk to your audience, where they are, through the most popular social channels in the world.',
  },
  {
    key: 4,
    title: 'Third-party login',
    description: 'Let workspace members log in using a set of third-party applications.',
  },
];

const RegisterWorkspaceCards = () => {
  return (
    <Grid mbs={16}>
      {
        cardsInfo.map(card => (
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

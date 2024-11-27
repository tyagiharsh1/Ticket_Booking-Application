import { app } from 'app';
import { OrderCancelledListener } from 'events/listeners/OrderCancelledListener';
import { OrderCreatedListener } from 'events/listeners/OrderCreatedListener';
import mongoose from 'mongoose';
import { natsWrapper } from 'NatsWrapper';

const start = async () => {
  if (!process.env.JWT_KEY) {
    throw new Error('[Tickets] JWT_KEY must be defined');
  }

  if (!process.env.MONGO_URI) {
    throw new Error('[Tickets] MONGO_URI must be defined');
  }

  if (!process.env.NATS_CLUSTER_ID) {
    throw new Error('[Tickets] NATS_CLUSTER_ID must be defined');
  }

  if (!process.env.NATS_CLIENT_ID) {
    throw new Error('[Tickets] NATS_CLIENT_ID must be defined');
  }

  if (!process.env.NATS_URL) {
    throw new Error('[Tickets] NATS_URL must be defined');
  }

  try {
    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL
    );

    natsWrapper.client.on('close', () => {
      console.log('[Tickets] NATS connection closed!');
      process.exit();
    });

    process.on('SIGINT', () => natsWrapper.client.close());
    process.on('SIGTERM', () => natsWrapper.client.close());

    new OrderCreatedListener(natsWrapper.client).listen();
    new OrderCancelledListener(natsWrapper.client).listen();

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });

    console.log('[Tickets] Connected to MongoDB');
  } catch (err) {
    console.log(err);
  }
};

app.listen(3000, () => {
  console.log('[Tickets] Listening on port 3000');
});

start();

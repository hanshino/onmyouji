import * as line from "@line/bot-sdk";
import express from "express";
import * as dotenv from "dotenv";
import { ImgurClient } from "imgur";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env.local" });
}

const imgurClient = new ImgurClient({
  clientId: process.env.IMGUR_CLIENT_ID,
});

// create LINE SDK config from env variables
const config = {
  channelSecret: process.env.CHANNEL_SECRET,
} as line.MiddlewareConfig;

// create LINE SDK client
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN as string,
});

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post("/webhook", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
function handleEvent(event: line.WebhookEvent) {
  switch (event.type) {
    case "message":
      return handleMessageEvent(event);
    default:
      throw new Error(`Unknown event: ${event.type}`);
  }
}

function handleMessageEvent(event: line.MessageEvent) {
  switch (event.message.type) {
    case "text":
      return handleTextMessage(event);
    default:
      throw new Error(`Unknown message: ${event.message.type}`);
  }
}

function handleTextMessage(event: line.MessageEvent) {
  const textMessage = event.message as line.TextEventMessage;
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

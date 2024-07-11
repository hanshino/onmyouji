import * as line from "@line/bot-sdk";
import express from "express";
import * as dotenv from "dotenv";
import { ImgurClient } from "imgur";
import { sqlite3, Line } from "./lib";

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

const lineApiDataClient = new Line({
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

async function handleTextMessage(event: line.MessageEvent) {
  const textMessage = event.message as line.TextEventMessage;
  if (!event.source.userId) {
    return;
  }

  if (event.source.type === "user") {
    const user = await sqlite3("users")
      .where("line_id", event.source.userId)
      .first();
    if (!user) {
      const profile = await client.getProfile(event.source.userId);
      await sqlite3("users").insert({
        line_id: event.source.userId,
        display_name: profile.displayName,
        picture_url: profile.pictureUrl,
      });
    }
  }

  const commands = ["個人遊戲簡介", "確認上傳"];
  if (!commands.includes(textMessage.text)) {
    return;
  }

  switch (textMessage.text) {
    case "個人遊戲簡介":
      return showUserCard(event);
    case "確認上傳":
      return handleUpload(event);
    default:
      return;
  }
}

async function showUserCard(event: line.MessageEvent) {
  const userId = event.source.userId;
  const userCard = await sqlite3("user_cards").where("line_id", userId).first();

  if (!userCard) {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: "親❤️……抱歉☹️小編還未「收錄」你百鬼物語Go個人遊戲簡介！\n⬇️步驟⬇️\n1️⃣：請直接發送圖片\n2️⃣：然後回覆圖片輸入「確認上傳」",
          quoteToken: (event.message as line.TextEventMessage).quoteToken,
        },
      ],
    });
  }

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [
      {
        type: "image",
        originalContentUrl: userCard.card_url,
        previewImageUrl: userCard.card_url,
      },
    ],
  });
}

async function handleUpload(event: line.MessageEvent) {
  const { quotedMessageId } = event.message as line.TextEventMessage;
  if (!quotedMessageId) {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: "抱歉…操作失敗❌\n「請對著你的圖片進行回覆：確認上傳」",
        },
      ],
    });
  }

  try {
    const quotedMessage = await lineApiDataClient.getMessageContent(
      quotedMessageId
    );
    const result = await imgurClient.upload({
      image: quotedMessage,
    });
    const { link } = result.data;
    if (result.status !== 200) {
      throw new Error("Failed to upload the image.");
    }

    const hasUserCard = await sqlite3("user_cards")
      .where("line_id", event.source.userId)
      .first();

    if (hasUserCard) {
      await sqlite3("user_cards").where("line_id", event.source.userId).update({
        card_url: link,
      });
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text: `親❤️小編已確認✅收錄✅\n🎉請再次輸入：個人遊戲簡介🎉`,
          },
        ],
      });
    }

    await sqlite3("user_cards").insert({
      line_id: event.source.userId,
      card_url: link,
    });

    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: `親❤️小編已確認✅收錄✅\n🎉請再次輸入：個人遊戲簡介🎉`,
        },
      ],
    });
  } catch (err) {
    console.error(err);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: "抱歉…操作失誤❌\n「請先直接發送圖片，然後對準自己圖片進行回覆：確認上傳」",
        },
      ],
    });
  }
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

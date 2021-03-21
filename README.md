## Vogelhut Game Night

This is a Jackbox Party Pack voting tool. Connect it to a Pushbullet account and push messages from your phone in order to cast a vote. I used [Tasker](https://tasker.joaoapps.com/) to connect Pushbullet and Messages/WhatsApp. Add `PUSHBULLET_API_KEY` to a local .env file.

The development server can be run with:

```bash
npm run dev
# or
yarn dev
```

or in release mode with:

```bash
npm run build
npm start
# or
yarn build
yarn start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

In its current form, this is inteded to be run locally by a host who will broadcast their screen to other players over Discord or similar.

# Vercel Deployment Guide

## What You Need

- A GitHub account
- A Vercel account
- A Supabase project that already has:
  - `schema.sql` executed
  - Realtime enabled for `rooms`, `room_players`, `pick_events`, `chat_messages`
  - Storage buckets:
    - `song-audio`
    - `cover-images`
    - `avatars`

You do not need your own public IP.
The public website URL will come from Vercel after deployment.

## 1. Push This Project To GitHub

Create a GitHub repository and push the current project.

## 2. Import The Project In Vercel

1. Open Vercel.
2. Click `Add New` -> `Project`.
3. Import your GitHub repository.
4. Keep the framework preset as `Next.js`.

## 3. Configure Environment Variables

In the Vercel project settings, add:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Optional:

```bash
NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app
```

Important:
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` in browser-side runtime variables.
- This project currently works with the public anon key for client-side room sync and storage access.

## 4. Deploy

After saving the environment variables:

1. Trigger the first deployment.
2. Wait for build success.
3. Open the generated Vercel domain.

Example:

```text
https://your-project-name.vercel.app
```

That is the public URL you can send to your friends.

## 5. Verify After Deployment

Open the site on two different devices or browsers and verify:

1. Player A creates a room.
2. Player B opens the same public URL.
3. Player B can see the room in the lobby or join by room code.
4. Both sides see player count updates.
5. Start the game and confirm both sides receive cards.
6. Upload a song, cover, avatar, or custom card image and confirm the URL is from Supabase Storage.

## 6. Recommended Launch Flow

For now, the safest real-world usage is:

1. You create the room first.
2. Your friend opens the same public URL.
3. Your friend joins using the room code or lobby list.
4. Test one short match before using custom libraries in a longer session.

## 7. What To Learn From Touhou Card Player V3

The reference project is useful for interaction design, not for replacing this project's backend architecture.

Good ideas to borrow:

- Share-code based room joining
- Clear participant list
- Spectator / observer mode
- Chat box in room
- Better connection status messaging
- Clear distinction between host and guest actions

Keep in this project:

- Supabase for room state
- Supabase Realtime for sync
- Supabase Storage for uploaded assets

Do not switch the whole project back to pure PeerJS unless you want to rebuild multiplayer around host-to-peer networking.

## 8. If Deployment Fails

Check these first:

- Vercel environment variables are filled correctly
- Supabase URL and anon key match the same project
- `song-audio`, `cover-images`, `avatars` buckets exist
- Realtime tables are enabled
- The deployed site can create and join rooms without showing the Supabase diagnostics alert

## 9. Next Recommended Improvements

- Add guest login / anonymous session flow
- Add explicit sync status UI
- Add ownership and edit permissions for song libraries and decks
- Add a room chat panel inspired by `touhou-card-player-v3-main`
- Bind a custom domain after the Vercel deployment is stable

# Supabase Setup Guide

This project can already build, but reliable online multiplayer depends on a correctly initialized Supabase project.

## What To Set Up

You need these pieces in Supabase:

- Database schema for rooms, players, pick events, decks, song libraries, and chat
- Realtime enabled for multiplayer tables
- Auth enabled for optional account features
- Storage for song audio files and cover images

## 1. Create A Supabase Project

1. Open Supabase and create a new project.
2. Copy:
   - Project URL
   - Anon public key
3. Put them into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 2. Apply The Schema

The schema file already exists at [supabase/schema.sql](D:/work/hobby/karuta-game/karuta-game-v2/supabase/schema.sql).

In Supabase:

1. Open `SQL Editor`
2. Paste the contents of `schema.sql`
3. Run it once

This creates:

- `users`
- `rooms`
- `room_players`
- `pick_events`
- `decks`
- `song_libraries`
- `chat_messages`
- `room_list_view`

It also enables:

- RLS policies
- Realtime tables
- cleanup functions

## 3. Verify The Important Tables

After running the SQL, confirm these exist:

- `rooms`
- `room_players`
- `pick_events`
- `chat_messages`
- `room_list_view`

If `room_list_view` is missing, the lobby room list will not work.

## 4. Realtime

The SQL already adds tables to `supabase_realtime`, but confirm Realtime is enabled for:

- `rooms`
- `room_players`
- `pick_events`
- `chat_messages`

Without this, players in different locations will not see live updates reliably.

## 5. Storage Buckets

Create at least these buckets:

- `song-audio`
- `cover-images`
- `avatars`

Recommended usage:

- `song-audio`: uploaded song clips or full tracks
- `cover-images`: anime/song/card covers
- `avatars`: user profile pictures

For early development, you can allow public read on `cover-images`. For `song-audio`, decide whether you want:

- public read for simple playback
- signed URLs for tighter control

## 6. Recommended Data Model Direction

Current project state:

- custom card decks are partly local-first
- song libraries are still mainly localStorage-first
- multiplayer room flow expects Supabase

Recommended production direction:

1. Save user-created decks into `decks`
2. Save user-created song libraries into `song_libraries`
3. Store uploaded files in Storage and save only URLs/paths in database rows
4. Keep room state in `rooms` and player state in `room_players`

## 7. Quick Health Check

Once setup is complete, verify this sequence:

1. Open the site locally
2. Click `创建房间`
3. Confirm the UI switches into the room page
4. Open the site in a second browser or device
5. Join by room code
6. Confirm both sides see the same player list update
7. Start the game and confirm state sync updates on both sides

## 8. Current Risk To Expect

If Supabase is configured in `.env.local` but the database schema is incomplete, the app may:

- stay on the lobby after clicking `创建房间`
- show no room cards in the lobby
- fail multiplayer joins
- fail room sync without obvious UI feedback

That matches the current symptoms in this repo.

## 9. Deployment Recommendation

Use this stack:

- Frontend: Vercel
- Database/Auth/Realtime/Storage: Supabase

Deployment flow:

1. Push repo to GitHub
2. Import repo into Vercel
3. Add the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## 10. Next Recommended Engineering Step

After schema setup, the next code task should be:

- migrate custom song library and card upload flows from localStorage to Supabase + Storage

That is the main missing step before this becomes a real nationwide multiplayer site instead of a local prototype.

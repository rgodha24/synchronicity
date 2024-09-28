import { Hono } from "hono";
import { connectToMongo, Users } from "./db";
import { generateState, OAuth2RequestError, Spotify } from "arctic";
import { spotify } from "./auth";
import { getCookie, setCookie } from "hono/cookie";
import { jwt, sign, type JwtVariables } from "hono/jwt";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { use } from "hono/jsx";

await connectToMongo();

console.log("connected to mongo");

type Variables = JwtVariables<{ id: string; exp: number }>;

const app = new Hono<{ Variables: Variables }>();

app.get("/", (c) => c.text("Hono!"));

app.use(
  "/authed/*",
  jwt({
    secret: process.env.JWT_SECRET!,
  }),
);

app.get("/authed/playlist", async (c) => {
  const payload = c.get("jwtPayload");
  console.log(payload);
  const user = await Users.findOne({ _id: payload.id });
  if (!user) {
    return c.body(null, 400);
  }

  const API = SpotifyApi.withAccessToken(process.env.SPOTIFY_CLIENT_ID!, {
    access_token: user.spotify_token,
    refresh_token: user.spotify_refresh_token,
    expires_in: user.spotify_token_iat.getTime(),
    token_type: "Bearer",
  });

  const playlists = await API.playlists.getUsersPlaylists(user.spotify_id);
  const playlistsItems = playlists.items;
  const playlist_fields: any[] = [];
  const songLinks = [];
  const searchYoutube = async (search: string) => {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(search)}&type=video&key=${process.env.GOOGLE_KEY}`,
    );
    const data = await response.json();
    const youtubeId = data.items[0].snippet.id.videoId;
    return youtubeId;
  };

  const downloadVideo = async (url: string) => {
    const download = await fetch("https://cobalt.tools/api", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
        audioFormat: "wav",
        downloadMode: "audio",
      }),
    });
    return download;
  };

  for (const playlist of playlistsItems) {
    const playlistId = playlist.id;
    const trackList = await API.playlists.getPlaylistItems(playlistId);
    playlist_fields.push({
      name: playlist.name,
      cover: playlist.images,
      songs: playlist.tracks.items.map((track) => track.track.name),
    });

    for (let song of trackList.items) {
      const search = `${song.track.name} by ${song.track.artists.map((artist) => artist.name).join(", ")}`;
      const youtubeUrl = `youtube.com/watch?v=${await searchYoutube(search)}`;
      const download = (await downloadVideo(youtubeUrl)).url;
      songLinks.push(download);
    }
  }

  return c.json({ authed: true });
});
app.get("/auth/login", async (c) => {
  const state = generateState();
  const url = await spotify.createAuthorizationURL(state, {
    scopes: ["playlist-read-private", "playlist-read-collaborative"],
  });

  setCookie(c, "spotify_oath_state", state, {
    path: "/",
    secure: process.env.NODE === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return c.redirect(url.toString());
});

app.get("/auth/callback", async (c) => {
  const code = c.req.query("code")?.toString() ?? null;
  const state = c.req.query("state")?.toString() ?? null;
  const storedState = getCookie(c).spotify_oath_state ?? null;
  if (!code || !state || !storedState || state !== storedState) {
    return c.body(null, 400);
  }

  try {
    const tokens = await spotify.validateAuthorizationCode(code);

    const user_data = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    const data = await user_data.json();
    const spotify_id: string = data.id;

    const existingUser = await Users.findOne({
      spotify_id,
    });

    if (existingUser) {
      existingUser.spotify_token = tokens.accessToken;
      existingUser.spotify_refresh_token = tokens.refreshToken;
      existingUser.spotify_token_iat = tokens.accessTokenExpiresAt;

      const token = await sign(
        {
          id: existingUser._id,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365, // Token expires in 1y
        },
        process.env.JWT_SECRET!,
      );

      const url = `synchronicity://auth?token=${encodeURIComponent(token)}`;
      console.log(url);

      return c.redirect(url);
    }

    const user = await Users.create({
      display_name: data.display_name,
      spotify_id: data.id,
      spotify_token: tokens.accessToken,
      spotify_refresh_token: tokens.refreshToken,
      spotify_token_iat: tokens.accessTokenExpiresAt,
    });

    const token = await sign(
      {
        id: user._id,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365, // Token expires in 1y
      },
      process.env.JWT_SECRET!,
    );

    const url = `synchronicity://auth?token=${encodeURIComponent(token)}`;
    console.log(url);

    return c.redirect(url);
  } catch (e) {
    if (
      e instanceof OAuth2RequestError &&
      e.message === "bad_verification_code"
    ) {
      // invalid code
      return c.body(null, 400);
    }
    return c.body(null, 500);
  }
});

export default app;

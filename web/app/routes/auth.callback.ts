import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { stateCookie } from "./auth.login";
import { lucia, spotify } from "~/auth";
import { Playlists, Users } from "~/db";
import { OAuth2RequestError } from "arctic";
import { nanoid } from "nanoid";
import { connectToMongo } from "~/dbdb";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  const code = new URLSearchParams(request.url.split("?")[1]).get("code");
  const state = new URLSearchParams(request.url.split("?")[1]).get("state");
  const storedState = await stateCookie.parse(request.headers.get("Cookie") || "");

  console.log("code", code);
  console.log("state", state);

  if (!code || !state || !storedState || state !== storedState) {
    return new Response("Invalid state or code", { status: 400 });
  }
  await connectToMongo();

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

      await existingUser.save();

      const session = await lucia.createSession(existingUser._id, {});
      const cookie = lucia.createSessionCookie(session.id);
      return redirect("/", {
        headers: {
          "Set-Cookie": cookie.serialize(),
        },
      });
    }

    const user = await Users.create({
      display_name: data.display_name,
      spotify_id: data.id,
      spotify_token: tokens.accessToken,
      spotify_refresh_token: tokens.refreshToken,
      spotify_token_iat: tokens.accessTokenExpiresAt,
      _id: nanoid(),
    });

    const API = SpotifyApi.withAccessToken(process.env.SPOTIFY_CLIENT_ID!, {
      access_token: user.spotify_token,
      refresh_token: user.spotify_refresh_token,
      expires_in:
        (user.spotify_token_iat.getTime() - new Date().getTime()) * 1000,
      token_type: "Bearer",
    });

    const playlists = await API.playlists.getUsersPlaylists(user.spotify_id);
    console.log(playlists.total);

    
    for (const playlist of playlists.items){
      const imgUrl = playlist.images && playlist.images.length > 0 && playlist.images[0].url ? playlist.images[0].url : "filler";
      const p = await Playlists.create({
        user: user._id,
        name: playlist.name,
        imgUrl: imgUrl 
      });
    }

    const session = await lucia.createSession(user._id, {});
    const cookie = lucia.createSessionCookie(session.id);
    return redirect("/", {
      headers: {
        "Set-Cookie": cookie.serialize(),
      },
    });
  } catch (e) {
    if (e instanceof OAuth2RequestError && e.message === "bad_verification_code") {
      // invalid code
      return new Response("Invalid code", { status: 400 });
    }

    console.error(e);

    return new Response("An error occurred", { status: 500 });
  }
}

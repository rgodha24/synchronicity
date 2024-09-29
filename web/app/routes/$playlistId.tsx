import { redirect, type LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { parseCookies } from "oslo/cookie";
import { lucia, spotify } from "~/auth";
import { Playlists } from "~/db";
import { connectToMongo } from "~/dbdb";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import YTMusic from "ytmusic-api";
import Motion from "~/Motion";

export const loader: LoaderFunction = async ({ request, context, params }) => {
  const sessionId = parseCookies(request.headers.get("Cookie") || "").get(
    lucia.sessionCookieName
  );
  await connectToMongo();
  if (!sessionId) {
    return redirect("/auth/login");
  }
  const result = await lucia.validateSession(sessionId);

  if (!result) {
    return redirect("/auth/login");
  }

  const { playlistId } = params;
  const playlist = await Playlists.findById(playlistId);
  const ytmusic = new YTMusic();
  await ytmusic.initialize(/* Optional: Custom cookies */);
  if (!playlist) {
    return new Response("not found", {
      status: 404,
    });
  }
  let songList: any[] = [];
  let songNames: string[] = [];
  for (const song of playlist.trackList.items) {
    const search = `${song.track.name} by ${song.track.artists
      .map((artist: { name: any }) => artist.name)
      .join(", ")}`;

    songNames.push(search);
  }
  return { playlist: playlist.toObject(), songs: songList, songNames };
};

export default function PlaylistPage() {
  const { playlist, songs, songNames } = useLoaderData<typeof loader>();

  return (
    <div>
      {JSON.stringify(playlist)}
      <Motion />
    </div>
  );
}

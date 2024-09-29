import { redirect, type LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { parseCookies } from "oslo/cookie";
import { lucia, spotify } from "~/auth";
import { Playlists } from "~/db";
import { connectToMongo } from "~/dbdb";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import YTMusic from "ytmusic-api"

export const loader: LoaderFunction = async ({ request, context, params }) => {
  const sessionId = parseCookies(request.headers.get("Cookie") || "").get(
    lucia.sessionCookieName
  );
  await connectToMongo();
  if (!sessionId) {
    return redirect("/login");
  }
  const result = await lucia.validateSession(sessionId);

  if (!result) {
    return redirect("/login");
  }

  const API = SpotifyApi.withClientCredentials(process.env.SPOTIFY_CLIENT_ID!,process.env.SPOTIFY_CLIENT_SECRET!);
  
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
    console.log(download);
    return download;
  };
  
  const { playlistId } = params;
  const playlist = await Playlists.findById(playlistId);
  const ytmusic = new YTMusic()
  await ytmusic.initialize(/* Optional: Custom cookies */)
  if (!playlist) {
    return new Response("not found", {
      status: 404,
    });
  }
  let songList: any[] = [];
  let songNames: string[] = [];
  for (const song of playlist.trackList){
    const search = `${song.track.name} by ${song.track.artists.map((artist: { name: any; }) => artist.name).join(", ")}`;
    const songs = await ytmusic.search(search)
    const trackId = song.track.id;
    console.log((await API.tracks.audioFeatures(trackId)).tempo);

    songList.push(songs[0]);
    songNames.push(search);
    
  }
  //console.log(songList)
  return { playlist: playlist.toObject(), songs: songList, songNames };
};

export default function PlaylistPage() {
  const { playlist, songs,songNames } = useLoaderData<typeof loader>();

  return <div>
    choose song
    <p>{songNames.map((songNames: any)=>(<div>
      {songNames}<a href=""></a></div>))} </p>
    </div>;
}

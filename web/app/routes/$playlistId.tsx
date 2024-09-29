import { redirect, type LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { parseCookies } from "oslo/cookie";
import { lucia } from "~/auth";
import { Playlists } from "~/db";
import { connectToMongo } from "~/dbdb";

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

  const { playlistId } = params;
  const playlist = await Playlists.findById(playlistId);

  if (!playlist) {
    return new Response("not found", {
      status: 404,
    });
  }

  return { playlist: playlist.toObject() };
};

export default function PlaylistPage() {
  const { playlist } = useLoaderData<typeof loader>();

  return <div>{JSON.stringify(playlist)}</div>;
}

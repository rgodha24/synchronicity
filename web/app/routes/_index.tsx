import {
  redirect,
  type LoaderFunction,
  type MetaFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { parseCookies } from "oslo/cookie";
import { lucia } from "~/auth";
import { Playlists } from "~/db";
import { connectToMongo } from "~/dbdb";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader: LoaderFunction = async ({ request }) => {
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

  const playlists = (await Playlists.find({ user: result.user?.id })).map((p) =>
    p.toObject()
  );
  console.log(JSON.stringify(playlists));
  return { playlists };
};

export default function Index() {
  const { playlists } = useLoaderData<typeof loader>();
  return (
    <div>
      choose playlist
      <p>
        {playlists.map((playlist: any) => (
          <div key={playlist._id}>
            <a href={"/" + playlist._id}>{playlist.name}</a>
          </div>
        ))}
      </p>
    </div>
  );
}

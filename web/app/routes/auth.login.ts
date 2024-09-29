import { createCookie, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { generateState } from "arctic";
import { spotify } from "~/auth";

export const stateCookie = createCookie("spotify-state", {
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  maxAge: 60 * 10,
});

export async function loader({}: LoaderFunctionArgs) {
  const state = generateState();
  const url = await spotify.createAuthorizationURL(state, {
    scopes: ["playlist-read-private", "playlist-read-collaborative"],
  });

  //set the state in the cookies as a secure httponly
  return redirect(url.toString(), {
    headers: {
      "Set-Cookie": await stateCookie.serialize(state),
    },
  });
}

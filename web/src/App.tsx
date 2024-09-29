import { atomWithStorage } from 'jotai/utils'
import './App.css'
import { useAtom } from 'jotai/react';


const tokenAtom = atomWithStorage<null | string>("token", null)

function App() {
  const [token, setToken] = useAtom(tokenAtom);

  if (window.location.pathname.startsWith("/auth")) {
    // get the token from the query params
    setToken(window.location.search.split("=")[1])
    window.location.href = "/playlist"
  }

  if (!token) {
    window.location.href = "/auth/login"
  }

  if (window.location.pathname === "/playlist") {
    return <ChoosePlaylist />
  }

  if (window.location.pathname.startsWith("/playlist/")) {
    return <Playlist />
  }

}

function ChoosePlaylist() {
  return <>
  </>
}
function Playlist() {
  const playlistId = window.location.pathname.split("/")[2]

  return <>
    <h1>Playlist {playlistId}</h1>
  </>
}

export default App

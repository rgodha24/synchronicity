import "../login.css";

export default function LogIn() {
  return (
    <body>
      <img
        src="assets/logo-gthack-1.png"
        alt="Synchronicity Logo"
        className="logo"
      />
      <div className="title">Synchronicity</div>
      <div className="subtitle">master your music</div>
      <a href="/auth/login" className="spotify-button">
        <img src="assets/image-1.png" alt="Spotify Logo" /> Continue with
        Spotify
      </a>
    </body>
  );
}

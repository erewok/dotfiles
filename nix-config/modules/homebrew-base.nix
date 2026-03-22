{ ... }:
{
  homebrew.enable = true;
  homebrew.onActivation.autoUpdate = true;
  homebrew.onActivation.cleanup = "zap";
  homebrew.global.brewfile = true;

  # GUI apps that run better through Homebrew than nixpkgs on macOS
  homebrew.casks = [
    "docker-desktop"
    "emacs-app"
    "firefox"
    "ghostty"
    "google-chrome"
    "iterm2"
    "spotify"
    "visual-studio-code"
    "zoom"
  ];

  # CLI tools via Homebrew
  # vfkit workaround: https://github.com/kevinmichaelchen/dotfiles/commit/ec3438f259f6f1b4e4de4b0ef3bee1308cf85128
  homebrew.brews = [
    "node"
    "openssl"
    "vfkit"
  ];
}

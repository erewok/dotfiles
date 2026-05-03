{ config, lib, pkgs, inputs, self, ... }:
let
  dotfilesPath = self;
in
{
  imports = [
    ../../nix-common
    ../../modules/macos.nix
    ../../modules/packages-base.nix
    ../../modules/homebrew-base.nix
    ./packages.nix
  ];

  nix-common = {
    enable = true;
    isDarwin = true;
    autoGC = false;
  };

  networking.hostName = "navanax";
  networking.computerName = "navanax";

  # Clock: 24h on personal machine (worktop uses 12h/AM-PM)
  system.defaults.menuExtraClock = {
    Show24Hour = true;
    ShowAMPM = false;
  };

  system.defaults.dock.persistent-apps = [
    "/Applications/Nix\ Apps/Reaper.app"
    "/Applications/Nix\ Apps/Signal.app"
  ];

  # Personal-machine-only homebrew packages
  homebrew.casks = [ "1password" ];
  homebrew.brews = [
    # PostgreSQL managed by Homebrew so brew services handles launchd + initdb
    {
      name = "postgresql@18";
      restart_service = true;
      link = true;
    }
    "pgvector"
  ];

  system.primaryUser = "erewok";
  users.users.erewok = {
    name = "erewok";
    home = "/Users/erewok";
  };

  environment.variables.alt_hostname = "navanax";

  # Home Manager
  home-manager.useGlobalPkgs = true;
  home-manager.backupFileExtension = "bak";
  home-manager.extraSpecialArgs = { inherit dotfilesPath; };
  home-manager.users.erewok = { pkgs, lib, ... }: {
    imports = [ ../../modules/home-base.nix ];

    home.username = "erewok";
    home.homeDirectory = "/Users/erewok";

    # Terminal config files (font-size 16 — navanax display)
    home.file.".config/ghostty/config".source = "${dotfilesPath}/ghostty/config";
    home.file.".config/ghostty/config.ghostty".source = "${dotfilesPath}/ghostty/config";
    home.file."Library/Application Support/com.mitchellh.ghostty/config".source = "${dotfilesPath}/ghostty/config";
    home.file."Library/Application Support/com.mitchellh.ghostty/config.ghostty".source = "${dotfilesPath}/ghostty/config";
    home.file."Library/Application Support/iTerm2/DynamicProfiles/Nix.json".source = "${dotfilesPath}/iterm2/Nix.json";

    programs.vscode.profiles.default.userSettings =
      builtins.fromJSON (builtins.readFile "${dotfilesPath}/vscode/vscode-settings-personal.json");

    programs.zsh.initContent = ''
      # --- Homebrew ---
      eval "$(/opt/homebrew/bin/brew shellenv)"

      # Show timestamps when running `history` command (oh-my-zsh)
      HIST_STAMPS="yyyy-mm-dd"

      # --- Pure prompt (Nix-installed, must be first) ---
      if type prompt_pure_setup &>/dev/null; then
        prompt pure
      fi

      # --- Direnv ---
      eval "$(direnv hook zsh)"

      # --- fnm (Node version manager) ---
      eval "$(fnm env --use-on-cd --shell zsh)"

      # --- SSH (system ssh-add stores passphrase in macOS Keychain) ---
      /usr/bin/ssh-add --apple-use-keychain ~/.ssh/id_rsa 2>/dev/null

      # --- iTerm2 shell integration ---
      [[ -f "$HOME/.iterm2_shell_integration.zsh" ]] && source "$HOME/.iterm2_shell_integration.zsh"

      # --- FZF ---
      [[ -f ~/.fzf.zsh ]] && source ~/.fzf.zsh

      # --- Word jump (Option+Left/Right) ---
      # iTerm2: Profiles → Keys → Left/Right Option = "Esc+"; add: Option+Left → "b", Option+Right → "f"
      bindkey "^[b" backward-word
      bindkey "^[f" forward-word
      bindkey "^[[1;3D" backward-word  # Option+Left (xterm-style)
      bindkey "^[[1;3C" forward-word   # Option+Right

      # --- Docker Desktop completions ---
      if [[ -d "$HOME/.docker/completions" ]]; then
        fpath=("$HOME/.docker/completions" $fpath)
        autoload -Uz compinit && compinit
      fi

      # --- Source custom shell config from dotfiles repo ---
      [[ -f "$HOME/open_source/dotfiles/shell/home-zshrc" ]] && source "$HOME/open_source/dotfiles/shell/home-zshrc"
      [[ -f "$HOME/open_source/dotfiles/shell/home-aliases" ]] && source "$HOME/open_source/dotfiles/shell/home-aliases"
    '';
  };

  nixpkgs.hostPlatform = "aarch64-darwin";
  system.stateVersion = 5;
}

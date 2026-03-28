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

  ids.gids.nixbld = 350;

  networking.hostName = "navanax";
  networking.computerName = "navanax";

  # Clock: 24h on personal machine (worktop uses 12h/AM-PM)
  system.defaults.menuExtraClock = {
    IsAnalog = false;
    Show24Hour = true;
    ShowAMPM = false;
    ShowDayOfMonth = true;
    ShowDayOfWeek = true;
    ShowDate = 1;
    ShowSeconds = false;
  };

  system.defaults.dock.persistent-apps = [
    "/System/Applications/Mission\ Control.app"
    "/System/Applications/System\ Settings.app"
    "/Applications/Firefox.app"
    "/Applications/Ghostty.app"
    "/Applications/Visual\ Studio Code.app"
    "/Applications/Nix\ Apps/Reaper.app"
    "/Applications/Emacs.app"
    "/Applications/Spotify.app"
    "/Applications/Nix\ Apps/Signal.app"
    "/System/Applications/Calculator.app"
    "/Applications/iTerm.app"
  ];

  system.defaults.screencapture.location = "/Users/erewok/Pictures/Screenshots";

  # Personal-machine-only casks
  homebrew.casks = [ "1password" ];

  # iTerm2: copy on selection
  system.activationScripts.iterm2CopyOnSelect.text = ''
    sudo -u erewok /usr/bin/defaults write com.googlecode.iterm2 CopySelection -bool true
  '';

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
    home.file."Library/Application Support/iTerm2/DynamicProfiles/Nix.json".source = "${dotfilesPath}/iterm2/Nix.json";

    programs.vscode.profiles.default.userSettings =
      builtins.fromJSON (builtins.readFile "${dotfilesPath}/vscode/vscode-settings-personal.json");

    programs.zsh.shellAliases = {
      nix-rebuild = "sudo darwin-rebuild switch --flake ~/open_source/dotfiles";
    };

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
    '';
  };

  nixpkgs.hostPlatform = "aarch64-darwin";
  system.stateVersion = 5;
}

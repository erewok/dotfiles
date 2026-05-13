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
    ../../modules/services.nix
    ./packages.nix
  ];

  nix-common = {
    enable = true;
    isDarwin = true;
    autoGC = false;
  };

  networking.hostName = "GW3TX9XVDT";
  networking.computerName = "GW3TX9XVDT";

  # Clock: 12h / AM-PM on work machine (navanax uses 24h)
  system.defaults.menuExtraClock = {
    Show24Hour = false;
    ShowAMPM = true;
  };

  system.defaults.dock.persistent-apps = [
    "/Applications/Slack.app"
  ];

  # Work-machine-only taps, casks, and brews
  homebrew.taps = [ "Azure/kubelogin" ];
  homebrew.casks = [
    "bitwarden"
    "copilot-cli"
    "dbeaver-community"
    "kubecontext"
    "slack"
  ];
  homebrew.brews = [
    "azure/kubelogin/kubelogin"
    "helm"
    "pango" # required for weasyprint
    # PostgreSQL managed by Homebrew so brew services handles launchd + initdb
    {
      name = "postgresql@18";
      restart_service = true;
      link = true;
    }
    "pgvector"
    "qsv"
  ];

  # kubectl plugins not in nixpkgs — install via krew at build time
  system.activationScripts.krewPlugins.text = ''
    sudo -u eaker /run/current-system/sw/bin/krew install ai deprecations 2>/dev/null || true
  '';

  # Symlink kubectl plugins that Nix installs under different names
  system.activationScripts.kubectlPlugins.text = ''
    ln -sf /run/current-system/sw/bin/kubectx      /run/current-system/sw/bin/kubectl-ctx    2>/dev/null || true
    ln -sf /run/current-system/sw/bin/kubens       /run/current-system/sw/bin/kubectl-ns     2>/dev/null || true
    ln -sf /run/current-system/sw/bin/kubectl-tree /run/current-system/sw/bin/kubectl-tree   2>/dev/null || true
    ln -sf /run/current-system/sw/bin/popeye       /run/current-system/sw/bin/kubectl-popeye 2>/dev/null || true
  '';

  system.primaryUser = "eaker";
  users.users.eaker = {
    name = "eaker";
    home = "/Users/eaker";
  };

  environment.variables.alt_hostname = "GW3TX9XVDT";

  # Home Manager
  home-manager.useGlobalPkgs = true;
  home-manager.backupFileExtension = "bak";
  home-manager.extraSpecialArgs = { inherit dotfilesPath; };
  home-manager.users.eaker = { pkgs, lib, ... }: {
    imports = [ ../../modules/home-base.nix ];

    home.username = "eaker";
    home.homeDirectory = "/Users/eaker";

    # Terminal config files (font-size 18 — worktop display)
    home.file.".config/ghostty/config".source = "${dotfilesPath}/ghostty/config";
    home.file.".config/ghostty/config.ghostty".source = "${dotfilesPath}/ghostty/config";
    home.file."Library/Application Support/com.mitchellh.ghostty/config".source = "${dotfilesPath}/ghostty/config";
    home.file."Library/Application Support/com.mitchellh.ghostty/config.ghostty".source = "${dotfilesPath}/ghostty/config";
    home.file."Library/Application Support/iTerm2/DynamicProfiles/Nix.json".source = "${dotfilesPath}/iterm2/Nix-worktop.json";

    # Starship prompt
    programs.starship.enable = true;
    home.file.".config/starship.toml".source = "${dotfilesPath}/starship/starship.toml";

    programs.vscode.profiles.default.userSettings =
      builtins.fromJSON (builtins.readFile "${dotfilesPath}/vscode/vscode-settings-work.json");

    programs.zsh.shellAliases = {
      nix-rebuild = lib.mkForce "sudo darwin-rebuild switch --flake ~/open_source/dotfiles#worktop";
      # kubectl
      k = "kubecolor";
      kubectl = "kubecolor";
      kk = "krew";
      kctx = "kubectx";
      kns = "kubens";
      # copilot-cli installs as 'copilot' binary
      copilot-cli = "copilot";
    };

    programs.zsh.initContent = ''
      # --- Homebrew ---
      eval "$(/opt/homebrew/bin/brew shellenv)"

      # Show timestamps when running `history` command (oh-my-zsh)
      HIST_STAMPS="yyyy-mm-dd"

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

      # --- Kubectl completion ---
      source <(kubectl completion zsh 2>/dev/null) || true

      # --- Docker Desktop completions ---
      if [[ -d "$HOME/.docker/completions" ]]; then
        fpath=("$HOME/.docker/completions" $fpath)
        autoload -Uz compinit && compinit
      fi

      # Kubernetes
      export KUBE_EDITOR="emacs"

      # --- NVM ---
      export NVM_DIR="$HOME/.nvm"
      [[ -s "/opt/homebrew/opt/nvm/nvm.sh" ]] && . "/opt/homebrew/opt/nvm/nvm.sh"
      [[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ]] && . "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"

      # --- Source custom shell config from dotfiles repo ---
      [[ -f "$HOME/open_source/dotfiles/shell/work-zshrc" ]] && source "$HOME/open_source/dotfiles/shell/work-zshrc"
      [[ -f "$HOME/open_source/dotfiles/shell/work-aliases" ]] && source "$HOME/open_source/dotfiles/shell/work-aliases"
    '';
  };

  nixpkgs.hostPlatform = "aarch64-darwin";
  system.stateVersion = 5;
}

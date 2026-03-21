{ config, lib, pkgs, inputs, self, ... }:
let
  inherit (lib) mkIf elem;
  caskPresent = cask: lib.any (x: x.name == cask) config.homebrew.casks;
  brewEnabled = config.homebrew.enable;
  pkgs-master = import inputs.nixos-master {
    "system" = "aarch64-darwin";
    config = { allowUnfree = true; };
  };
  dotfilesPath = self;
in
{
  nix-common = {
    enable = true;
    isDarwin = true;
    autoGC = false;
  };
  ids.gids.nixbld = 350;

  # local builder
  nix = {
    linux-builder = {
      enable = true;
      ephemeral = true;
      maxJobs = 4;
      config = {
        virtualisation = {
          darwin-builder = {
            diskSize = 80 * 1024;
            memorySize = 12 * 1024;
          };
          cores = 6;
        };
      };
    };
    settings.trusted-users = [ "@admin" ];
  };

  networking.hostName = "GW3TX9XVDT";
  networking.computerName = "GW3TX9XVDT";

  # mac settings
  system.startup.chime = false;

  # Please stay this way
  system.keyboard.enableKeyMapping = true;
  system.keyboard.remapCapsLockToControl = true;

  system.defaults.NSGlobalDomain = {
    AppleShowAllFiles = true;
    AppleEnableMouseSwipeNavigateWithScrolls = false;
    AppleEnableSwipeNavigateWithScrolls = false;
    AppleShowAllExtensions = true;
    "com.apple.trackpad.scaling" = 1.0;
    "com.apple.trackpad.enableSecondaryClick" = true;
    "com.apple.trackpad.trackpadCornerClickBehavior" = 1;
    "com.apple.swipescrolldirection" = false;
    AppleInterfaceStyleSwitchesAutomatically = true;
    AppleMeasurementUnits = "Inches";
    AppleMetricUnits = 0;
    AppleShowScrollBars = "Always";
    AppleScrollerPagingBehavior = false;
    AppleTemperatureUnit = "Fahrenheit";
    InitialKeyRepeat = 15;
    KeyRepeat = 2;
    NSAutomaticCapitalizationEnabled = false;
    NSAutomaticDashSubstitutionEnabled = false;
    NSAutomaticPeriodSubstitutionEnabled = false;
    NSAutomaticQuoteSubstitutionEnabled = false;
    NSAutomaticSpellingCorrectionEnabled = false;
    NSDisableAutomaticTermination = true;
    NSAutomaticWindowAnimationsEnabled = true;
    NSDocumentSaveNewDocumentsToCloud = false;
    AppleWindowTabbingMode = "manual";
    NSNavPanelExpandedStateForSaveMode = true;
    NSNavPanelExpandedStateForSaveMode2 = true;
    PMPrintingExpandedStateForPrint = true;
    PMPrintingExpandedStateForPrint2 = true;
    NSTableViewDefaultSizeMode = 1;
    NSTextShowsControlCharacters = true;
    NSUseAnimatedFocusRing = true;
    NSScrollAnimationEnabled = true;
    NSWindowResizeTime = 0.25;
    NSWindowShouldDragOnGesture = false;
    _HIHideMenuBar = false;
    "com.apple.keyboard.fnState" = false;
    "com.apple.sound.beep.volume" = 0.2;
    "com.apple.sound.beep.feedback" = 1;
    AppleICUForce24HourTime = true;
    "com.apple.springing.enabled" = false;
    "com.apple.springing.delay" = 1.0;
  };

  # firewall set to block and stealth mode
  networking.applicationFirewall = {
    enableStealthMode = true;
    blockAllIncoming = true;
  };

  system.defaults.menuExtraClock = {
    IsAnalog = false;
    Show24Hour = true;
    ShowAMPM = false;
    ShowDayOfMonth = true;
    ShowDayOfWeek = true;
    ShowDate = 1;
    ShowSeconds = false;
  };

  # dock settings require relogging in
  system.defaults.dock = {
    appswitcher-all-displays = true;
    autohide = true;
    autohide-delay = 0.24;
    autohide-time-modifier = 0.8;
    dashboard-in-overlay = true;
    expose-group-apps = false;
    enable-spring-load-actions-on-all-items = true;
    expose-animation-duration = 0.8;
    launchanim = true;
    mru-spaces = false;
    tilesize = 24;
    mineffect = "genie";
    magnification = false;
    largesize = 24;
    mouse-over-hilite-stack = true;
    minimize-to-application = false;
    orientation = "bottom";
    # Do the hot corners
    wvous-bl-corner = 4; # Desktop
    wvous-br-corner = 13; # Lock Screen
    wvous-tl-corner = 2; # Mission Control
    wvous-tr-corner = 2; # Mission Control
    persistent-apps = [
      "/System/Applications/Mission\ Control.app"
      "/System/Applications/System\ Settings.app"
      "/Applications/iTerm.app"
      "/Applications/Bitwarden.app"
      "/Applications/Visual\ Studio Code.app"
      "/System/Applications/Calculator.app"
    ];
    show-process-indicators = true;
    showhidden = true;
    show-recents = false;
    static-only = false;
  };

  system.defaults.spaces.spans-displays = false;

  system.defaults.trackpad = {
    TrackpadRightClick = true;
    TrackpadThreeFingerDrag = true;
    TrackpadThreeFingerHorizSwipeGesture = 0;
    TrackpadFourFingerHorizSwipeGesture = 2;
  };

  system.defaults.finder = {
    AppleShowAllFiles = true;
    ShowStatusBar = true;
    ShowPathbar = true;
    FXEnableExtensionChangeWarning = true;
    FXDefaultSearchScope = "SCcf";
    FXPreferredViewStyle = "clmv"; #list
    AppleShowAllExtensions = true;
    CreateDesktop = false;
    QuitMenuItem = false;
    _FXShowPosixPathInTitle = true;
  };

  system.defaults.screencapture = {
    location = "/Users/erikaker/Pictures/Screenshots";
    type = "png";
    disable-shadow = false;
  };

  # why is this not the default in MacOS?
  security.pam.services.sudo_local = {
    enable = true;
    touchIdAuth = true;
    reattach = true;
  };

  # Just install everything as systemPackages rather than futz with home-manager for now
  # use chezmoi for compatibility with non NixOS / nix-darwin systems
  # some packages such as libressl and openssh already exist in OSX, but we want the latest
  environment.systemPackages = with pkgs; [
    argocd
    argo-workflows
    aspell
    azure-cli
    bat
    btop
    chezmoi
    curl
    dig
    direnv
    dive
    egctl
    fluent-bit
    fzf
    gcc
    gh
    git
    git-lfs
    gnuplot
    go
    go-outline
    gopls
    gotools
    graphviz
    htop
    hugo
    jq
    just
    kubectl
    kubecolor
    kubeconform
    kubectx
    kubectl-images
    kubectl-tree
    kubernetes-helm
    krew
    lazygit
    libressl
    lstr
    netcat
    nginx
    nil
    nix-zsh-completions
    nixpkgs-fmt
    nmap
    openssh
    openssl
    pkgs-master.claude-code
    popeye
    postgresql
    protobuf
    pure-prompt
    python3
    rectangle
    ripgrep
    rustup
    scc
    shellcheck
    stern
    terminal-notifier
    terraform
    tree
    trivy
    uv
    wget
    yamllint
    zsh-completions
    zsh-syntax-highlighting
  ];

  environment.shells = with pkgs; [
    bashInteractive
    zsh
  ];
  environment.variables = {
    alt_hostname = "GW3TX9XVDT";
  };

  system.primaryUser = "erikaker";

  # Required by Home Manager to resolve home.username / home.homeDirectory
  users.users.erikaker = {
    name = "erikaker";
    home = "/Users/erikaker";
  };

  # also need to run chsh -s /run/current-system/sw/bin/zsh
  environment.variables.SHELL = "${pkgs.zsh}/bin/zsh";

  # Fonts (Required for Pure prompt icons)
  fonts.packages = [ pkgs.nerd-fonts.meslo-lg ];

  # kubectl plugins not in nixpkgs — install via krew at build time (flame has no darwin/arm64)
  system.activationScripts.krewPlugins.text = ''
    sudo -u erikaker /run/current-system/sw/bin/krew install ai deprecations 2>/dev/null || true
  '';

  # kubectl plugin symlinks (Nix installs some plugins under different names)
  system.activationScripts.kubectlPlugins.text = ''
    ln -sf /run/current-system/sw/bin/kubectx     /run/current-system/sw/bin/kubectl-ctx    2>/dev/null || true
    ln -sf /run/current-system/sw/bin/kubens      /run/current-system/sw/bin/kubectl-ns     2>/dev/null || true
    ln -sf /run/current-system/sw/bin/kubectl-tree /run/current-system/sw/bin/kubectl-tree   2>/dev/null || true
    ln -sf /run/current-system/sw/bin/popeye       /run/current-system/sw/bin/kubectl-popeye 2>/dev/null || true
  '';

  # Three-finger drag requires both trackpad domains on modern macOS
  system.activationScripts.threeFingerDrag.text = ''
    /usr/bin/defaults write com.apple.AppleMultitouchTrackpad TrackpadThreeFingerDrag -bool true
    /usr/bin/defaults write com.apple.driver.AppleBluetoothMultitouch.trackpad TrackpadThreeFingerDrag -bool true
    /usr/bin/defaults write com.apple.AppleMultitouchTrackpad Dragging -bool false
    /usr/bin/defaults write com.apple.driver.AppleBluetoothMultitouch.trackpad Dragging -bool false
  '';

  # Enable macOS locate: load daemon (weekly Sat 03:15) and build DB at rebuild
  system.activationScripts.locate.text = ''
    launchctl load -w /System/Library/LaunchDaemons/com.apple.locate.plist 2>/dev/null || true
    /usr/libexec/locate.updatedb
  '';

  # iTerm2: copy on selection (select text → auto-copied to clipboard)
  system.activationScripts.iterm2CopyOnSelect.text = ''
    sudo -u erikaker /usr/bin/defaults write com.googlecode.iterm2 CopySelection -bool true
  '';

  # Create /etc/zshrc that loads the nix-darwin environment.
  programs.zsh.enable = true;

  # homebrew (requires homebrew installed outside of nix)
  # /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  homebrew.enable = true;
  homebrew.onActivation.autoUpdate = true;
  homebrew.onActivation.cleanup = "zap";
  homebrew.global.brewfile = true;

  homebrew.taps = [
    "Azure/kubelogin"
    "railwaycat/emacsmacport"
  ];

  # these gui apps tend to run better through homebrew
  homebrew.casks = [
    "azure/azd/azd"
    "azure/kubelogin/kubelogin"
    "bitwarden"
    "copilot-cli"
    "dbeaver-community"
    "docker-desktop"
    "emacs-mac"
    "firefox"
    "ghostty"
    "google-chrome"
    "iterm2"
    "slack"
    "spotify"
    "visual-studio-code"
    "zoom"
  ];

  # the nixpkgs version of helm doesn't currently support aarch64-darwin
  # vfkit work around from https://github.com/kevinmichaelchen/dotfiles/commit/ec3438f259f6f1b4e4de4b0ef3bee1308cf85128
  homebrew.brews = [
    "helm"
    "kube-ps1"
    "node"
    "openssl"
    "vfkit"
  ];

  # Home Manager Configuration for ZSH and Dotfiles
  home-manager.useGlobalPkgs = true;
  home-manager.backupFileExtension = "bak";
  home-manager.users.erikaker = { pkgs, lib, ... }: {
    home.username = "erikaker";
    home.homeDirectory = "/Users/erikaker";
    home.stateVersion = "24.11";

    # Export ZSH to nix store path (Home Manager omits this; required for oh-my-zsh)
    home.sessionVariables.ZSH = "${pkgs.oh-my-zsh}/share/oh-my-zsh";

    programs.git = {
      enable = true;
      settings.core.sshCommand = "/usr/bin/ssh";
    };

    # VSCode settings for work machine
    programs.vscode = {
      enable = true;
      mutableExtensionsDir = true;

      profiles.default = {
        # Load settings from dotfiles repo
        userSettings = builtins.fromJSON (builtins.readFile "${dotfilesPath}/vscode/vscode-settings-work.json");

        # Core extensions managed by Nix (most stable/available)
        extensions = with pkgs.vscode-extensions; [
          charliermarsh.ruff
          dbaeumer.vscode-eslint
          esbenp.prettier-vscode
          golang.go
          jnoortheen.nix-ide
          mkhl.direnv
          ms-python.python
          ms-python.debugpy
          redhat.vscode-yaml
          rust-lang.rust-analyzer
          tamasfe.even-better-toml
        ];
      };
    };

    # zsh + oh-my-zsh (HM generates ~/.zshrc)
    programs.zsh = {
      enable = true;
      history = {
        extended = true;  # Save timestamps in history file (: timestamp:0;command)
        size = 50000;
        save = 50000;
        share = true;     # Share history between sessions
        ignoreDups = true;
      };
      oh-my-zsh = {
        enable = true;
        plugins = [ "git" ];
        theme = "";
      };
      shellAliases = {
        ll = "ls -alFG";
        la = "ls -aG";
        l = "ls -CFG";
        ls = "ls -G";
        tree = "lstr";
        cat = "bat";
        mv = "mv -i";
        rm = "rm -i";
        # Nix-managed kubectl aliases
        k = "kubecolor";
        kubectl = "kubecolor";
        kk = "krew";
        kctx = "kubectx";
        kns = "kubens";
        # Nix rebuild shortcuts
        nix-rebuild = "sudo darwin-rebuild switch --flake ~/open_source/dotfiles";
        nix-rollback = "sudo darwin-rebuild switch --rollback";
        # copilot-cli installs as 'copilot' binary
        copilot-cli = "copilot";
      };
      initExtra = ''
        # --- Homebrew ---
        eval "$(/opt/homebrew/bin/brew shellenv)"

        # Show timestamps when running `history` command (oh-my-zsh)
        HIST_STAMPS="yyyy-mm-dd"

        # --- Pure prompt (Nix-installed, must be first) ---
        if type prompt_pure_setup &>/dev/null; then
          prompt pure
        fi

        # --- Kube-ps1 (load after Pure so we can append to its PROMPT line) ---
        for _kube_ps1 in /opt/homebrew/share/kube-ps1.sh /usr/local/share/kube-ps1.sh; do
          if [[ -f "$_kube_ps1" ]]; then
            source "$_kube_ps1"
            # Produces:
            # ~/path master* ⇣
            # [14:32:05] (⎈|cluster:namespace) ❯
            # ▌  ← cursor here
            PROMPT='%F{242}[%D{%H:%M:%S}]%f $(kube_ps1) '$PROMPT$'\n'
            break
          fi
        done
        unset _kube_ps1

        # --- Direnv ---
        eval "$(direnv hook zsh)"

        # --- SSH (system ssh-add stores passphrase in macOS Keychain) ---
        /usr/bin/ssh-add --apple-use-keychain ~/.ssh/id_rsa 2>/dev/null

        # --- iTerm2 shell integration ---
        [[ -f "$HOME/.iterm2_shell_integration.zsh" ]] && source "$HOME/.iterm2_shell_integration.zsh"

        # --- FZF ---
        [[ -f ~/.fzf.zsh ]] && source ~/.fzf.zsh

        # --- Word jump (Option+Left/Right): stop Option from printing chars; use Esc+b / Esc+f ---
        # iTerm2: Preferences → Profiles → Keys → Left/Right Option = "Esc+"; add: Option+Left → Send "b", Option+Right → Send "f"
        bindkey "^[b" backward-word
        bindkey "^[f" forward-word
        bindkey "^[[1;3D" backward-word  # Option+Left (xterm-style)
        bindkey "^[[1;3C" forward-word   # Option+Right

        # --- Kubectl completion ---
        source <(kubectl completion zsh 2>/dev/null) || true
        export KUBE_EDITOR="vim"

        # --- Docker Desktop completions ---
        if [[ -d "$HOME/.docker/completions" ]]; then
          fpath=("$HOME/.docker/completions" $fpath)
          autoload -Uz compinit && compinit
        fi

        # --- NVM ---
        export NVM_DIR="$HOME/.nvm"
        [[ -s "/opt/homebrew/opt/nvm/nvm.sh" ]] && . "/opt/homebrew/opt/nvm/nvm.sh"
        [[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ]] && . "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"

        # --- Source custom shell config from dotfiles repo ---
        [[ -f "$HOME/open_source/dotfiles/shell/zshrc" ]] && source "$HOME/open_source/dotfiles/shell/work-zshrc"
      '';
    };
  };

  nixpkgs.hostPlatform = "aarch64-darwin";
  system.stateVersion = 5;
}

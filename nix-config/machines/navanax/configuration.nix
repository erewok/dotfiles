{ config, lib, pkgs, inputs, ... }:
let
  inherit (lib) mkIf elem;
  caskPresent = cask: lib.any (x: x.name == cask) config.homebrew.casks;
  brewEnabled = config.homebrew.enable;
  pkgs-master = import inputs.nixos-master {
    "system" = "aarch64-darwin";
    config = { allowUnfree = true; };
  };
  dotfilesPath = /Users/erikaker/open_source/dotfiles;
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

  # mac settings
  system.startup.chime = false;

  # Please stay this way
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
      "/Applications/Firefox.app"
      "/Applications/Ghostty.app"
      "/Applications/Emacs.app"
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
    location = "/Users/erewok/Pictures/Screenshots";
    type = "png";
    disable-shadow = false;
  };

  # why is this not the default in MacOS?
  security.pam.services.sudo_local = {
    enable = true;
    touchIdAuth = true;
    reattach = true;
  };

  # Personal machine packages - dev tools without k8s/cloud stuff
  environment.systemPackages = with pkgs; [
    aspell
    bat
    btop
    curl
    dig
    direnv
    emacs
    fzf
    gcc
    gdb
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
    protobuf
    pure-prompt
    python3
    rectangle
    ripgrep
    rustup
    scc
    shellcheck
    spotify
    terminal-notifier
    tree
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
    alt_hostname = "navanax";
  };

  # Install firefox.
  programs.firefox.enable = true;

  system.primaryUser = "erewok";

  # Required by Home Manager to resolve home.username / home.homeDirectory
  users.users.erewok = {
    name = "erewok";
    home = "/Users/erewok";
  };

  # also need to run chsh -s /run/current-system/sw/bin/zsh
  environment.variables.SHELL = "${pkgs.zsh}/bin/zsh";

  # Fonts (Required for Pure prompt icons)
  fonts.packages = [ pkgs.nerd-fonts.meslo-lg ];

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
    sudo -u erewok /usr/bin/defaults write com.googlecode.iterm2 CopySelection -bool true
  '';

  # Create /etc/zshrc that loads the nix-darwin environment.
  programs.zsh = {
    enable = true;
    shellAliases = {
      # Define your aliases here
      ll = "ls -alFG";
      la = "ls -aG";
      l = "ls -CFG";
      ls = "ls -G";
      tree = "lstr";
      cat = "bat";
      mv = "mv -i";
      rm = "rm -i";
    };
    # ... other zsh options like setOptions, etc. ...
  };

  # homebrew (requires homebrew installed outside of nix)
  # /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  environment.shellInit = mkIf brewEnabled ''
    eval "$(${config.homebrew.brewPrefix}/brew shellenv)"
  '';

  homebrew.enable = true;
  homebrew.onActivation.autoUpdate = true;
  homebrew.onActivation.cleanup = "zap";
  homebrew.global.brewfile = true;

  homebrew.taps = [
    "homebrew/services"
  ];

  # these gui apps tend to run better through homebrew
  homebrew.casks = [
    "1password"
    "docker-desktop"
    "ghostty"
    "google-chrome"
    "iterm2"
    "visual-studio-code"
    "zoom"
  ];

  # the nixpkgs version of helm doesn't currently support aarch64-darwin
  # vfkit work around from https://github.com/kevinmichaelchen/dotfiles/commit/ec3438f259f6f1b4e4de4b0ef3bee1308cf85128
  homebrew.brews = [
    "node"
    "openssl"
    "vfkit"
  ];

  # Home Manager Configuration for ZSH and Dotfiles
  home-manager.useGlobalPkgs = true;
  home-manager.backupFileExtension = "bak";
  home-manager.users.erewok = { pkgs, lib, ... }: {
    home.username = "erewok";
    home.homeDirectory = "/Users/erewok";
    home.stateVersion = "24.11";

    # Export ZSH to nix store path (Home Manager omits this; required for oh-my-zsh)
    home.sessionVariables.ZSH = "${pkgs.oh-my-zsh}/share/oh-my-zsh";

    # Symlink Emacs Prelude configuration from dotfiles
    home.file.".emacs.d" = {
      source = "${dotfilesPath}/emacs";
      recursive = true;
    };

    programs.git = {
      enable = true;
      extraConfig.core.sshCommand = "/usr/bin/ssh";
    };

    # VSCode settings for personal machine
    programs.vscode = {
      enable = true;
      mutableExtensionsDir = true;  # Allow manual extension management

      # Load settings from dotfiles repo
      userSettings = builtins.fromJSON (builtins.readFile "${dotfilesPath}/vscode/vscode-settings-personal.json");

      # Core extensions managed by Nix (lighter set for personal use)
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
        # Nix rebuild shortcuts
        nix-rebuild = "darwin-rebuild switch --flake ~/nix-config";
        nix-rollback = "darwin-rebuild switch --rollback";
      };
      initExtra = ''
        # Show timestamps when running `history` command (oh-my-zsh)
        HIST_STAMPS="yyyy-mm-dd"

        # --- Pure prompt (Nix-installed, must be first) ---
        if type prompt_pure_setup &>/dev/null; then
          prompt pure
        fi

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
        [[ -f "$HOME/open_source/dotfiles/shell/zshrc" ]] && source "$HOME/open_source/dotfiles/shell/home-zshrc"
      '';
    };
  };

  nixpkgs.hostPlatform = "aarch64-darwin";
  system.stateVersion = 5;
}

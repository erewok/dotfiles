{ config, lib, pkgs, inputs, ... }:
let
  inherit (lib) mkIf elem;
  caskPresent = cask: lib.any (x: x.name == cask) config.homebrew.casks;
  brewEnabled = config.homebrew.enable;
  pkgs-master = import inputs.nixos-master {
    "system" = "aarch64-darwin";
    config = { allowUnfree = true; };
  };
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
    location = "/Users/kyle.risse/Pictures/Screenshots";
    type = "png";
    disable-shadow = false;
  };

  # why is this not the default in MacOS?
  security.pam.services.sudo_local.touchIdAuth = true;

  # Just install everything as systemPackages rather than futz with home-manager for now
  # use chezmoi for compatibility with non NixOS / nix-darwin systems
  # some packages such as libressl and openssh already exist in OSX, but we want the latest
  environment.systemPackages = with pkgs; [
    argocd
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
    emacs
    fluent-bit
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
    helm
    htop
    jq
    just
    kubectl
    kubectx
    lazygit
    libressl
    lstr
    netcat
    nginx
    nix-zsh-completions
    nixpkgs-fmt
    openssh
    openssl
    pkgs-master.claude-code
    protobuf
    python3
    python3Packages.uv
    ripgrep
    rustup
    scc
    shellcheck
    terminal-notifier
    trivy
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
    alt_hostname = "orca";
  };

  system.primaryUser = "erewok";
  # also need to run chsh -s /run/current-system/sw/bin/fish
  environment.variables.SHELL = "${pkgs.zsh}/bin/zsh";

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
      switch = "darwin-rebuild switch --flake ~/nix-config/flake.nix";
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
    "azure/azd/azd"
    "azure/kubelogin/kubelogin"
    "dbeaver-community"
    "ghostty"
    "iterm2"
    "visual-studio-code"
    "zoom"
  ];

  # the nixpkgs version of helm doesn't currently support aarch64-darwin
  # vfkit work around from https://github.com/kevinmichaelchen/dotfiles/commit/ec3438f259f6f1b4e4de4b0ef3bee1308cf85128
  homebrew.brews = [
    "helm"
    "vfkit"
  ];
}

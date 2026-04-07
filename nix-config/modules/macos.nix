{ pkgs, lib, ... }:
{
  # --- Startup & Keyboard ---
  system.startup.chime = false;
  system.keyboard.enableKeyMapping = true;
  system.keyboard.remapCapsLockToControl = true;

  # --- Global macOS defaults ---
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

  # Dock layout — persistent-apps set per machine
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
    tilesize = 64;
    magnification = false;
    mineffect = "genie";
    largesize = 64;
    mouse-over-hilite-stack = true;
    minimize-to-application = false;
    orientation = "bottom";
    wvous-bl-corner = 4;   # Desktop
    wvous-br-corner = 13;  # Lock Screen
    wvous-tl-corner = 2;   # Mission Control
    wvous-tr-corner = 2;   # Mission Control
    show-process-indicators = true;
    showhidden = true;
    show-recents = false;
    static-only = false;
  };

  system.defaults.spaces.spans-displays = false;

  system.defaults.trackpad = {
    TrackpadRightClick = true;
    TrackpadThreeFingerDrag = false;
    TrackpadThreeFingerHorizSwipeGesture = 2;
    TrackpadFourFingerHorizSwipeGesture = 0;
  };

  system.defaults.finder = {
    AppleShowAllFiles = true;
    ShowStatusBar = true;
    ShowPathbar = true;
    FXEnableExtensionChangeWarning = true;
    FXDefaultSearchScope = "SCcf";
    FXPreferredViewStyle = "clmv"; # column view
    AppleShowAllExtensions = true;
    CreateDesktop = false;
    QuitMenuItem = false;
    _FXShowPosixPathInTitle = true;
  };

  # Screencapture — location set per machine (different usernames)
  system.defaults.screencapture = {
    type = "png";
    disable-shadow = false;
  };

  # --- Security & Networking ---
  networking.applicationFirewall = {
    enableStealthMode = true;
    blockAllIncoming = true;
  };

  # why is this not the default in macOS?
  security.pam.services.sudo_local = {
    enable = true;
    touchIdAuth = true;
    reattach = true;
  };

  # --- Shell environment ---
  environment.shells = with pkgs; [ bashInteractive zsh ];
  fonts.packages = [ pkgs.nerd-fonts.meslo-lg ];
  programs.zsh.enable = true;
  environment.variables = {
    SHELL = "${pkgs.zsh}/bin/zsh";
    XDG_CONFIG_HOME="$HOME/.config";
    LIBCLANG_PATH = "${pkgs.llvmPackages.libclang.lib}/lib";
    LIBRARY_PATH = lib.concatStringsSep ":" [
      "${pkgs.libiconv}/lib"
      "/Library/Developer/CommandLineTools/SDKs/MacOSX15.4.sdk/usr/lib"
    ];
    MACOSX_DEPLOYMENT_TARGET = "15.4";
    SDKROOT = "/Library/Developer/CommandLineTools/SDKs/MacOSX15.4.sdk";
    CPATH = "/Library/Developer/CommandLineTools/SDKs/MacOSX15.4.sdk/usr/include";
    # Force cc/c++ to Apple's toolchain, not Nix GCC
    CC = "/usr/bin/clang";
    CXX = "/usr/bin/clang++";
    AR = "/usr/bin/ar";
  };

  # --- Activation scripts ---
  # Force three-finger swipe for space switching (disable three-finger drag in both trackpad domains)
  system.activationScripts.threeFingerDrag.text = ''
    /usr/bin/defaults write com.apple.AppleMultitouchTrackpad TrackpadThreeFingerDrag -bool false
    /usr/bin/defaults write com.apple.driver.AppleBluetoothMultitouch.trackpad TrackpadThreeFingerDrag -bool false
    /usr/bin/defaults write com.apple.AppleMultitouchTrackpad Dragging -bool false
    /usr/bin/defaults write com.apple.driver.AppleBluetoothMultitouch.trackpad Dragging -bool false
  '';

  # Enable macOS locate: load daemon (weekly Sat 03:15) and build DB at rebuild
  system.activationScripts.locate.text = ''
    launchctl load -w /System/Library/LaunchDaemons/com.apple.locate.plist 2>/dev/null || true
    /usr/libexec/locate.updatedb
  '';
}

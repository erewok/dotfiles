{ pkgs, lib, dotfilesPath, vscodeSettingsFile, ... }:
{
  home.stateVersion = "24.11";

  # Drop binaries into ~/bin (or ~/.local/bin) and they are on PATH with no rebuild.
  home.sessionPath = [ "$HOME/.cargo/bin" "$HOME/bin" "$HOME/.local/bin" ];

  # Create the personal bin dirs so the sessionPath entries above are usable
  # immediately after a fresh install.
  home.activation.createUserBinDirs = lib.hm.dag.entryAfter [ "writeBoundary" ] ''
    mkdir -p "$HOME/bin" "$HOME/.local/bin"
  '';

  # Symlink ~/workspace/scripts/* into ~/bin when the directory exists
  home.activation.linkWorkspaceScripts = lib.hm.dag.entryAfter [ "createUserBinDirs" ] ''
    if [ -d "$HOME/workspace/scripts" ]; then
      for script in "$HOME/workspace/scripts"/*; do
        [ -e "$script" ] || continue
        ln -sf "$script" "$HOME/bin/$(basename "$script")"
      done
    fi
  '';

  # Emacs Prelude: clone the framework on first setup, symlink personal config
  home.activation.emacsPrelude = lib.hm.dag.entryAfter [ "writeBoundary" ] ''
    if [ ! -d "$HOME/.emacs.d/.git" ]; then
      if [ -d "$HOME/.emacs.d" ]; then
        if [ -d "$HOME/.emacs.d.bak" ]; then
          echo "WARNING: ~/.emacs.d has no git repo and ~/.emacs.d.bak already exists."
          echo "Please resolve manually (remove or inspect both directories) and re-run."
          exit 1
        fi
        echo "Backing up ~/.emacs.d to ~/.emacs.d.bak before cloning Prelude..."
        mv "$HOME/.emacs.d" "$HOME/.emacs.d.bak"
      fi
      echo "Cloning Emacs Prelude into ~/.emacs.d..."
      ${pkgs.git}/bin/git clone https://github.com/bbatsov/prelude.git "$HOME/.emacs.d"
    fi
  '';

  home.file.".emacs.d/personal/custom.el".source = "${dotfilesPath}/emacs/personal/custom.el";
  home.file.".emacs.d/personal/prelude-modules.el".source = "${dotfilesPath}/emacs/personal/prelude-modules.el";
  home.file.".emacs.d/personal/preload/compatibility.el".source = "${dotfilesPath}/emacs/personal/preload/compatibility.el";

  # Required for oh-my-zsh (Home Manager omits this env var)
  home.sessionVariables.ZSH = "${pkgs.oh-my-zsh}/share/oh-my-zsh";

  # Git
  programs.git = {
    enable = true;
    settings = {
      push.default = "simple";
      core.pager = "less -FRX";
      core.sshCommand = "/usr/bin/ssh";
      user.name = "Erik Aker";
      user.email = "eraker@gmail.com";
      alias = {
        br = "branch";
        cm = "commit";
        st = "status";
        co = "checkout";
        pu = "push";
        updates = "add -u";
        unstage = "reset HEAD";
        changed = "diff --cached";
        last = "log -1 HEAD";
        commands = "config --get-regexp '^alias'";
      };
    };
  };

  # Global gitignore -> ~/.config/git/ignore
  programs.git.ignores = [
    "**/.claude/settings.local.json"
  ];

  # Java runtime, so `java -jar tla2tools.jar` and friends just work.
  # The `tlaplus` package (packages-base.nix) ships tla2tools.jar plus tlc/tlasany wrappers.
  programs.java = {
    enable = true;
    package = pkgs.jdk21;
  };

  # VSCode — shared extensions; any extra extensions set per machine.
  #
  # userSettings is deliberately NOT set here: Home Manager would write
  # settings.json as a root-owned, read-only symlink into the Nix store, and every
  # extension that tries to persist a setting would fail and leave the file parked
  # as an unsaveable dirty editor. See home.activation.vscodeUserSettings below.
  #
  # mutableExtensionsDir lets extensions that aren't packaged in nixpkgs
  # (e.g. tlaplus.vscode-ide) be installed from the marketplace alongside these.
  programs.vscode = {
    enable = true;
    mutableExtensionsDir = true;
    profiles.default.extensions = with pkgs.vscode-extensions; [
      bierner.markdown-mermaid
      charliermarsh.ruff
      dbaeumer.vscode-eslint
      esbenp.prettier-vscode
      fill-labs.dependi
      golang.go
      jnoortheen.nix-ide
      mkhl.direnv
      ms-python.python
      ms-python.debugpy
      redhat.vscode-yaml
      rust-lang.rust-analyzer
      shd101wyy.markdown-preview-enhanced
      skellock.just
      tamasfe.even-better-toml
    ];
  };

  # Deploy VSCode user settings as a real writable file rather than a store symlink,
  # so VSCode and its extensions can save without prompting.
  #
  # The dotfiles JSON stays the source of truth and is re-copied on every rebuild.
  # A stamp file records what was last deployed; if the live settings.json has since
  # diverged (VSCode wrote to it), it is copied to settings.json.bak before being
  # replaced, so nothing is silently discarded.
  home.activation.vscodeUserSettings = lib.hm.dag.entryAfter [ "writeBoundary" ] ''
    vscodeUserDir="$HOME/Library/Application Support/Code/User"
    live="$vscodeUserDir/settings.json"
    stamp="$vscodeUserDir/.settings.json.nix-deployed"

    mkdir -p "$vscodeUserDir"

    # Home Manager owned this path in earlier generations; clear the stale symlink.
    # ('if' rather than '&&': activation runs under 'set -e'.)
    if [ -L "$live" ]; then
      rm -f "$live"
    fi

    # cmp fails when the stamp is absent, which also covers the first deploy over
    # a pre-existing hand-written settings.json.
    if [ -f "$live" ] && ! cmp -s "$live" "$stamp"; then
      cp -f "$live" "$live.bak"
    fi

    cp -f ${vscodeSettingsFile} "$live"
    chmod 644 "$live"
    cp -f ${vscodeSettingsFile} "$stamp"
    chmod 644 "$stamp"
  '';

  # ZSH — history, oh-my-zsh, and shared aliases
  # initContent and machine-specific aliases are set per machine
  programs.zsh = {
    enable = true;
    history = {
      extended = true; # save timestamps (: timestamp:0;command)
      size = 50000;
      save = 50000;
      share = true;
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
      cat = "bat -p";
      mv = "mv -i";
      rm = "rm -i";
      nix-rebuild = "sudo darwin-rebuild switch --flake ~/open_source/dotfiles";
      nix-rollback = "sudo darwin-rebuild switch --rollback";
      nix-gc = "nix-collect-garbage -d && sudo nix-collect-garbage -d";
      gpuu = "git push -u origin HEAD";
    };
  };

}

{ pkgs, dotfilesPath, ... }:
{
  home.stateVersion = "24.11";
  home.sessionPath = [ "$HOME/.cargo/bin" ];

  # Required for oh-my-zsh (Home Manager omits this env var)
  home.sessionVariables.ZSH = "${pkgs.oh-my-zsh}/share/oh-my-zsh";

  # Terminal config files
  home.file.".config/ghostty/config".source = "${dotfilesPath}/ghostty/config";
  home.file."Library/Application Support/iTerm2/DynamicProfiles/Nix.json".source = "${dotfilesPath}/iterm2/Nix.json";

  # Git
  programs.git = {
    enable = true;
    settings = {
      push.default = "simple";
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

  # VSCode — shared extensions; userSettings and any extra extensions set per machine
  programs.vscode = {
    enable = true;
    mutableExtensionsDir = true;
    profiles.default.extensions = with pkgs.vscode-extensions; [
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
      cat = "bat";
      mv = "mv -i";
      rm = "rm -i";
      nix-rollback = "sudo darwin-rebuild switch --rollback";
    };
  };
}

# Dotfiles for My Working Environment

This is a repo for keeping track of configuration files for my development environments.

This configuration has primarily moved to a nix-based setup. There are some historical files in here for reference.

## Nix-Darwin Setup

For OSX machines, I have two nix configurations: one for work (worktop) and one for personal (navanax).

### Fresh macOS Setup for Navanax

#### 1. Initial System Setup

```bash
# Install Xcode Command Line Tools (required for Git and compilation)
xcode-select --install

# Clone this repo
mkdir -p ~/open_source
cd ~/open_source
git clone https://github.com/erewok/dotfiles.git
cd dotfiles
```

#### 2. Install Nix

```bash
# Install Nix using Determinate Systems installer (flakes enabled by default)
curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install

# Source Nix in your current shell
. /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
```

#### 3. Install Homebrew

```bash
# Required for GUI apps and some packages
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add Homebrew to PATH for current session
eval "$(/opt/homebrew/bin/brew shellenv)"
```

#### 4. Install and Activate nix-darwin

```bash
cd ~/open_source/dotfiles

# This command fetches nix-darwin from the flake, then builds and activates the config
# The "switch" command means changes are applied immediately (no separate activation needed)
# Recent nix-darwin versions require root for activation
sudo nix run nix-darwin -- switch --flake .#navanax

# If sudo can't find nix, use the full path:
# sudo /nix/var/nix/profiles/default/bin/nix run nix-darwin -- switch --flake .#navanax

# For work machine, use:
# sudo nix run nix-darwin -- switch --flake .#GW3TX9XVDT
```


After this command completes:

- All packages are installed
- System preferences are applied
- Homebrew packages/casks are installed
- Shell configuration is active
- Emacs Prelude is symlinked

**Important:** Open a new terminal window/tab now. The `darwin-rebuild` command and other tools won't be in your PATH until you start a fresh shell session.

#### 5. Update Default Shell

```bash
# Change default shell to Nix-managed zsh
chsh -s /run/current-system/sw/bin/zsh

# Close and reopen terminal for changes to take effect
```

#### 6. Post-Install Configuration

```bash
# SSH key setup (for GitHub, etc.)
# Generate if needed:
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to macOS Keychain
/usr/bin/ssh-add --apple-use-keychain ~/.ssh/id_rsa

# Install iTerm2 shell integration (if using iTerm2)
curl -L https://iterm2.com/shell_integration/install_shell_integration_and_utilities.sh | bash

# Generate FZF shell integration file (fzf is nix-managed; zshrc sources this if present)
fzf --zsh > ~/.fzf.zsh
```

#### 7. Verify Installation

```bash
# Check nix-darwin is active (it runs without "command not found" if activation succeeded)
darwin-rebuild --help > /dev/null && echo "nix-darwin active"

# Check a few key packages are available
which git bat ripgrep fzf

# Use your custom alias for future rebuilds
nix-rebuild  # Alias defined in zsh config
```

#### 8. Manual Steps (System Preferences)

Your configuration sets many preferences automatically, but you may want to verify:

- **Trackpad:** Three-finger drag should be enabled
- **Dock:** Apps should be arranged per config, hot corners set
- **Security:** Touch ID for sudo should work
- **Screenshots:** Should save to `/Users/erewok/Pictures/Screenshots`

#### Future Updates

```bash
# Apply configuration changes
sudo darwin-rebuild switch --flake ~/open_source/dotfiles#navanax

# Or use the alias (also invokes sudo internally via the alias definition):
nix-rebuild

# Rollback if needed:
nix-rollback
```

#### What Gets Installed (Navanax)

- **Development tools:** emacs (with Prelude auto-configured), vscode, gh, git, direnv, rustup, go, python3, uv
- **CLI utilities:** bat, ripgrep, fzf, jq, htop, btop, lazygit, tree
- **GUI apps (Homebrew casks):** 1Password, Docker Desktop, Firefox, Ghostty, Chrome, iTerm2, VS Code, Zoom
- **GUI apps (Nix):** VS Code (via home-manager `programs.vscode`)
- **Fonts:** MesloLG Nerd Font (for Pure prompt)

The configuration also sets up macOS defaults, security settings (firewall, Touch ID sudo), and a Linux builder for cross-compilation.

## Emacs

I use [emacs prelude](https://github.com/bbatsov/prelude) for my Emacs configuration. On nix-darwin machines (navanax), this is automatically configured by symlinking the `emacs/` directory to `~/.emacs.d` during system rebuild.

In addition to enabling various language modes, I add the following to my custom.el:

```lisp
(custom-set-faces
 '(default ((t (:height 120 :weight normal :width expanded :family "Monaco")))))

(global-set-key (kbd "C->") 'next-buffer)
(global-set-key (kbd "C-<") 'previous-buffer)

(load-theme zenburn)

```

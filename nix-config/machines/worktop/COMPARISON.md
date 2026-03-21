# Configuration Comparison: worktop vs jpuccinelli

## Overview
This document compares your work MacBook Pro configuration with your coworker's setup to identify differences and guide configuration decisions.

---

## 1. User Configuration

| Category | Your Config (worktop) | Coworker (jpuccinelli) |
|----------|----------------------|------------------------|
| **Username** | ~~kyle.risse~~ → erikaker | jpuccinelli |
| **Home Directory** | /Users/erikaker | /Users/jpuccinelli |
| **Primary User** | erik → erikaker | jpuccinelli |
| **Users Block** | ❌ Missing | ✅ `users.users.jpuccinelli` defined |
| **Home Manager** | ❌ Not configured | ✅ Fully configured |

---

## 2. Nix & Nixpkgs Settings

| Feature | Your Config | Coworker |
|---------|-------------|----------|
| **nix-common module** | ✅ Enabled, autoGC=false | ✅ Enabled, autoGC not specified |
| **nix.enable** | ✅ true (inherited) | ❌ **false** (unusual!) |
| **allowUnfree** | ✅ true | ✅ true |
| **Linux Builder** | ✅ Full config (diskSize: 80GB, mem: 12GB) | ❌ Not configured |
| **State Version** | ❌ Not set (inherited from nix-common) | ✅ system.stateVersion = 5 |

---

## 3. System Packages

### Your Additional Packages (not in coworker's)
```nix
argocd, aspell, bat, btop, chezmoi, dive, egctl, emacs, fluent-bit,
gcc, gdb, git-lfs, gnuplot, go, go-outline, gopls, gotools, graphviz,
hugo, just, lazygit, libressl, lstr, netcat, nginx, pkgs-master.claude-code,
protobuf, rectangle, ripgrep, rustup, scc, shellcheck, spotify,
terminal-notifier, trivy, wget, yamllint, zsh-completions, zsh-syntax-highlighting
```

### Coworker's kubectl Packages (you need to add)
```nix
argocd               # ✅ You have
argo-workflows       # ❌ Add this
stern                # ❌ Add this
krew                 # ❌ Add this
kubecolor            # ❌ Add this
kubectl-tree         # ❌ Add this
kubectl-images       # ❌ Add this
kubeconform          # ❌ Add this
popeye               # ❌ Add this
```

### Coworker's Other Packages (you're missing)
```nix
nil                  # Nix LSP
htop                 # System monitor
nmap                 # Network scanner
tree                 # Directory tree (you use lstr)
pyenv                # Python version manager
poetry               # Python packaging
terraform            # Infrastructure as code
uv                   # ✅ You have
```

---

## 4. Homebrew Configuration

### Taps
| Your Config | Coworker |
|-------------|----------|
| ✅ homebrew/services | ❌ Not present |
| ✅ Azure/kubelogin | ✅ Azure/kubelogin |

### Brews
| Your Config | Coworker | Action |
|-------------|----------|--------|
| helm | azure-cli | ⚠️ Add azure-cli (you have in Nix) |
| vfkit | node | ⚠️ Add node |
| - | openssl | ⚠️ Add openssl |
| - | kube-ps1 | ⚠️ **Move from casks to brews** |
| - | Azure/kubelogin/kubelogin | ✅ Already in casks |
| - | gh | ⚠️ Add gh (you have in Nix) |

### Casks
| Package | Your Config | Coworker | Notes |
|---------|-------------|----------|-------|
| 1password | ✅ | ❌ | Keep |
| azure/azd/azd | ✅ | ❌ | Keep |
| **kube-ps1** | ✅ WRONG | ❌ | **Move to brews** |
| google-chrome | ❌ | ✅ | Add? |
| docker-desktop | ✅ | ✅ | ✓ |
| visual-studio-code | ✅ | ✅ | ✓ |
| iterm2 | ✅ | ✅ | ✓ |
| ghostty | ✅ | ❌ | Keep (modern terminal) |
| dbeaver-community | ✅ | ❌ | Keep |
| zoom | ✅ | ❌ | Keep |
| expressvpn | ❌ | ✅ | Add if needed |
| **miniconda** | ❌ | ✅ | **Add for Conda** |
| slack | ❌ | ✅ | **Add** |
| rectangle | ❌ | ✅ | **Add** (you have in Nix) |
| bitwarden | ❌ | ✅ | **Add** |
| **copilot-cli** | ❌ | ✅ | **Add** |
| suspicious-package | ❌ | ✅ | Add? (Quicklook plugin) |
| apparency | ❌ | ✅ | Add? (Quicklook plugin) |
| quicklookase | ❌ | ✅ | Add? (Quicklook plugin) |
| qlvideo | ❌ | ✅ | Add? (Quicklook plugin) |

---

## 5. ZSH / Terminal Configuration

### Current Setup
| Feature | Your Config | Coworker |
|---------|-------------|----------|
| **programs.zsh** | ✅ Basic (aliases only) | ✅ Enabled (minimal) |
| **Home Manager ZSH** | ❌ **NOT CONFIGURED** | ✅ **Fully configured** |
| **oh-my-zsh** | ❌ | ✅ Via Home Manager |
| **Pure prompt** | Package installed | ✅ Initialized in initContent |
| **kube-ps1** | ❌ Not configured | ✅ Fully integrated in PROMPT |
| **direnv** | Package only | ✅ Hook configured |
| **SSH keychain** | ❌ | ✅ Automatic ssh-add |
| **History config** | ❌ Default | ✅ 50k entries, timestamps, share |
| **FZF** | Package only | ✅ Sourced in shell |
| **Word jump** | ❌ | ✅ Option+Left/Right |
| **kubectl completion** | ❌ | ✅ Configured |
| **kubecolor alias** | ❌ | ✅ k=kubecolor, kubectl=kubecolor |
| **Conda** | ❌ Not configured | ✅ Full integration, custom prompt |
| **NVM** | ❌ | ✅ Configured |
| **Docker completions** | ❌ | ✅ Configured |
| **iTerm2 integration** | ❌ | ✅ Sourced |

### Your Aliases vs Coworker's
**Yours:**
```nix
ll, la, l, ls = "ls -G variants"
tree = "lstr"
cat = "bat"
mv/rm = "-i" (interactive)
switch = "darwin-rebuild switch --flake ~/nix-config/flake.nix"
```

**Coworker's:**
```nix
k = "kubecolor"
kubectl = "kubecolor"
kk = "krew"
kctx = "kubectx"
kns = "kubens"
nix-rebuild = "sudo darwin-rebuild switch --flake ~/workspace/code/devops/nix/jpuccinelli"
nix-rollback = "sudo darwin-rebuild switch --rollback"
copilot-cli = "copilot"
```

---

## 6. System Activation Scripts

| Script | Your Config | Coworker | Purpose |
|--------|-------------|----------|---------|
| **krewPlugins** | ❌ | ✅ | Installs kubectl ai, deprecations plugins |
| **kubectlPlugins** | ❌ | ✅ | Symlinks kubectx→kubectl-ctx, etc. |
| **threeFingerDrag** | ❌ | ✅ | Enables 3-finger drag (trackpad) |
| **locate** | ❌ | ✅ | Enables macOS locate database |
| **iterm2CopyOnSelect** | ❌ | ✅ | Auto-copy selected text |

---

## 7. Trackpad Settings

| Setting | Your Config | Coworker |
|---------|-------------|----------|
| TrackpadRightClick | ✅ true | ✅ true |
| **TrackpadThreeFingerDrag** | ❌ | ✅ true |
| TrackpadThreeFingerHorizSwipeGesture | ❌ (default 2) | 0 |
| TrackpadFourFingerHorizSwipeGesture | ❌ (default 2) | 2 |

---

## 8. macOS System Defaults Differences

### NSGlobalDomain
| Setting | Your Config | Coworker | Notes |
|---------|-------------|----------|-------|
| AppleInterfaceStyle | Auto | "Dark" | Coworker forces dark mode |
| swipescrolldirection | false (traditional) | true (natural) | Affects gestures |
| AppleEnableMouseSwipeNavigateWithScrolls | false | true | Browser nav |
| AppleEnableSwipeNavigateWithScrolls | false | true | Browser nav |

### Dock
| Setting | Your Config | Coworker |
|---------|-------------|----------|
| persistent-apps | 6 apps | 7 apps (adds Google Chrome) |
| wvous-tl-corner | 2 (Mission Control) | 13 (Lock Screen) |
| wvous-tr-corner | 2 (Mission Control) | ❌ Not set |
| ShowSeconds (menubar) | false | ✅ **true** |

### Finder
| Setting | Your Config | Coworker |
|---------|-------------|----------|
| _FXShowPosixPathInTitle | ✅ true | ❌ Not set |

### Screenshots
| Setting | Your Config | Coworker |
|---------|-------------|----------|
| location | ~/Pictures/Screenshots | ~/Desktop |
| disable-shadow | false | true |
| **target** | ❌ (save to file) | "clipboard" |

---

## 9. Home Manager: What's Missing

Your coworker has **complete Home Manager integration** that you lack:

### programs.git
```nix
enable = true
extraConfig.core.sshCommand = "/usr/bin/ssh"
```

### programs.zsh (via Home Manager)
- Extended history with timestamps
- oh-my-zsh with git plugin
- 200+ lines of initContent with:
  - Pure prompt setup
  - kube-ps1 with custom PROMPT formatting
  - direnv hook
  - SSH keychain integration
  - iTerm2 shell integration
  - FZF configuration
  - Word navigation bindings
  - Kubectl completion
  - All kubectl aliases
  - Conda configuration with prompt handling
  - NVM configuration
  - Docker completions
  - Custom functions (`get-app-permissions`, `conda_activate`)

### home.file (Dotfile Symlinks)
```nix
Library/Preferences/com.apple.Terminal.plist
Library/Application Support/Code/User/settings.json
Library/Application Support/Code/User/keybindings.json
Library/Application Support/Cursor/User/settings.json
Library/Application Support/Cursor/User/keybindings.json
```

### home.sessionVariables
```nix
ZSH = "${pkgs.oh-my-zsh}/share/oh-my-zsh"
```

---

## 10. Additional Software

| Category | Your Config | Coworker |
|----------|-------------|----------|
| **Firefox** | ✅ programs.firefox.enable | ❌ |
| **Spotify** | ✅ Nix package | ❌ |
| **Emacs** | ✅ Nix package | ❌ |
| **Go tooling** | ✅ go, gopls, go-outline, gotools | ❌ |
| **Rust** | ✅ rustup | ❌ |

---

## Summary of Critical Changes Needed

### HIGH PRIORITY (for matching terminal environment)
1. ✅ **Fix username**: kyle.risse → erikaker
2. ✅ **Add users.users.erikaker block**
3. ✅ **Add Home Manager configuration** with full ZSH setup
4. ✅ **Add kubectl tooling**: krew, kubecolor, kubectl-tree, kubectl-images, kubeconform, popeye
5. ✅ **Move kube-ps1** from casks to brews
6. ✅ **Add activation scripts**: krewPlugins, kubectlPlugins, threeFingerDrag, locate, iterm2CopyOnSelect
7. ✅ **Add TrackpadThreeFingerDrag** settings

### MEDIUM PRIORITY (for workflow compatibility)
8. ✅ **Add homebrew packages**: miniconda, slack, rectangle, bitwarden, copilot-cli, node, openssl
9. ✅ **Add kubectl aliases** in Home Manager ZSH config
10. ✅ **Configure Conda** in ZSH initContent

### OPTIONAL (based on preferences)
11. Add Quicklook plugins (suspicious-package, apparency, quicklookase, qlvideo)
12. Change screenshot target to clipboard
13. Add Google Chrome to dock
14. Enable menubar seconds
15. Force dark mode vs auto-switching

---

## Configuration Philosophy Differences

**Your Approach:**
- More dev tools installed (broader toolset)
- Uses **chezmoi** for dotfile management
- Linux builder enabled for cross-platform builds
- Keeps more apps in persistent dock
- Firefox instead of Chrome focus

**Coworker's Approach:**
- Uses **Home Manager** exclusively for dotfiles
- Focused kubectl/k8s workflow with full tooling
- Extensive ZSH customization in Nix
- Conda-heavy Python workflow
- nix.enable = false (managed by nix-common only)

---

## Next Steps

1. Apply username fixes throughout config
2. Add Home Manager configuration block
3. Add kubectl packages and activation scripts
4. Adjust homebrew packages (move kube-ps1, add missing)
5. Test rebuild: `darwin-rebuild switch --flake ~/nix-config/flake.nix`
6. Manual post-install:
   - Run `chsh -s /run/current-system/sw/bin/zsh` (not fish as comment says)
   - Install iTerm2 shell integration: `curl -L https://iterm2.com/shell_integration/zsh -o ~/.iterm2_shell_integration.zsh`
   - Install FZF shell integration: `$(brew --prefix)/opt/fzf/install`
   - Verify kubectl plugins: `kubectl krew list`, `kubectl tree --help`

---

Generated: 2026-03-20

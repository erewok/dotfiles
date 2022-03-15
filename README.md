# Dotfiles for My Working Environment

This is a repo for keeping track of configuration files for my development environments.

Following are some notes I have written for myself to remember how to set everything up.

## OSX

### Shell Stuff ###

- Update XCode (Wait for ten days for it complete).
- Install git
  - Use gitconfig
- Install homebrew
- Install htop (`brew install htop`)
- Install jq (json viewer: `brew install jq`)
- Copy zshrc and create aliases file
- Install pyenv and poetry
- Install AdoptOpenJDK Java 11
- Install ghcup
- Install stack
- Install rustup
- Install ripgrep
- Install exa
- Install Docker for Mac


### Zshell

Zshell installation:

```
brew install zsh zsh-completions
```

[Pure theme](https://github.com/Zearin/zsh-pure)

[Tomorrow Night Eighties Theme](https://github.com/chriskempson/tomorrow-theme)

Import the theme directly into OSX terminal.

If you want `kubectl config current-context` in the shell, use this:

Git clone this to an open_source dir: https://github.com/jonmosco/kube-ps1

And then make sure to uncomment the following in the zshellrc:

```
# Kubectl context
NEWLINE=$'\n'
source ~/open_source/kube-ps1/kube-ps1.sh
PROMPT='$(kube_ps1)${NEWLINE}'$PROMPT
```

### Editor Stuff ###

- Install emacs >= 26: `brew cask install emacs`
- Install VSCode


### Emacs

I have stopped maintaining my emacs environment in favor of [emacs prelude](https://github.com/bbatsov/prelude). This one is a fine enough slate of Emacs

In addition to enabling various language modes, I simply add the following to my custom.el:

```lisp
(custom-set-faces
 '(default ((t (:height 120 :weight normal :width expanded :family "Monaco")))))

(global-set-key (kbd "C->") 'next-buffer)
(global-set-key (kbd "C-<") 'previous-buffer)

(load-theme zenburn)

```

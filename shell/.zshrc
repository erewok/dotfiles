# aliases
alias ll='ls -alFG'
alias la='ls -AG'
alias l='ls -CFG'
alias ls='ls -G'
alias mv='mv -i'
alias rm='rm -i'

# EMACS
alias emacs='/Applications/Emacs.app/Contents/MacOS/Emacs'
export EDITOR=emacs

# GPG Agent
# eval $(gpg-agent --daemon --allow-preset-passphrase)
export PATH="/usr/local/opt/gpg-agent/bin:$PATH"
export GPG_TTY=$(tty)

# Python
export PATH=~/anaconda/bin:$PATH

# Haskell/Stack
export PATH=/Users/erik/.local/bin:$PATH

# Rust/Cargo
source $HOME/.cargo/env

# NPM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

# Zsh Completions
fpath=(/usr/local/share/zsh-completions $fpath)
plugins=(zsh-completions)
autoload -U compinit && compinit

# Zshell Pure
autoload -U promptinit && promptinit
prompt pure

# You may also need to force rebuild `zcompdump`:

#  rm -f ~/.zcompdump; compinit

# Additionally, if you receive "zsh compinit: insecure directories" warnings when attempting
# to load these completions, you may need to run this:

#  chmod go-w '/usr/local/share'
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Java
# export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-8.jdk/Contents/Home

# aliases
source $HOME/.aliases

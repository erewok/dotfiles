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

# Python
export PATH=~/anaconda3/bin:$PATH

# Rust/Cargo
source $HOME/.cargo/env

# NPM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

fpath=(/usr/local/share/zsh-completions $fpath)

# Zshell Pure
autoload -U promptinit && promptinit
prompt pure

# You may also need to force rebuild `zcompdump`:

#  rm -f ~/.zcompdump; compinit

# Additionally, if you receive "zsh compinit: insecure directories" warnings when attempting
# to load these completions, you may need to run this:

#  chmod go-w '/usr/local/share'

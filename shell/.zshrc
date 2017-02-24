alias ll='ls -alFG'
alias la='ls -AG'
alias l='ls -CFG'
alias ls='ls -G'
alias mv='mv -i'
alias rm='rm -i'
alias emacs='/Applications/Emacs.app/Contents/MacOS/Emacs'
export EDITOR=emacs

autoload -U promptinit && promptinit
prompt pure

export PATH=$PATH:~/.local/bin:~/.cargo/bin
# alias rusti="LD_LIBRARY_PATH=~/.multirust/toolchains/nightly-x86_64-apple-darwin/lib/ rusti"
# export NVM_DIR=~/.nvm
# . /usr/local/opt/nvm/nvm.sh

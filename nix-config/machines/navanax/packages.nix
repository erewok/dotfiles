{ pkgs, inputs, ... }:
let
  pkgs-master = import inputs.nixos-master {
    system = "aarch64-darwin";
    config = { allowUnfree = true; };
  };
in
{
  # Personal machine packages — dev tools, no k8s/cloud
  environment.systemPackages = with pkgs; [
    pkgs-master.claude-code
    pkgs-master.ollama
    pkgs-master.signal-desktop
    pkgs-master.zola
    pure-prompt
    reaper
    tmux
  ];
}

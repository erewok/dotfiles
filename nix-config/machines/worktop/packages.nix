{ pkgs, inputs, ... }:
let
  pkgs-master = import inputs.nixos-master {
    system = "aarch64-darwin";
    config = { allowUnfree = true; };
  };
in
{
  # Work machine packages — k8s, cloud, and infra tooling
  environment.systemPackages = with pkgs; [
    pkgs-master.claude-code
    argocd
    argo-workflows
    azure-cli
    chezmoi
    dive
    egctl
    kubectl
    kubecolor
    kubeconform
    kubectx
    kubectl-images
    kubectl-tree
    kubernetes-helm
    krew
    ollama
    popeye
    redis
    starship
    stern
    terraform
    tmux
    tree
    trivy
  ];
}

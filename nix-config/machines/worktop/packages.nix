{ pkgs, ... }:
{
  # Work machine packages — k8s, cloud, and infra tooling
  environment.systemPackages = with pkgs; [
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

{ pkgs, inputs, ... }:
let
  pkgs-master = import inputs.nixos-master {
    system = "aarch64-darwin";
    config = { allowUnfree = true; };
    overlays = [
      (final: prev: {
        linkerd_edge = prev.stdenv.mkDerivation rec {
          pname = "linkerd_edge";
          version = "25.10.7";
          src = prev.fetchurl {
            url = "https://github.com/linkerd/linkerd2/releases/download/edge-${version}/linkerd2-cli-edge-${version}-darwin-arm64";
            hash = "sha256-CLyQsiBMejCRI/9GuSWSDtbZC1J8/3L7wYL/D63mKU4=";
          };
          dontUnpack = true;
          installPhase = ''
            mkdir -p $out/bin
            cp $src $out/bin/linkerd
            chmod +x $out/bin/linkerd
          '';
          meta = with prev.lib; {
            description = "Linkerd edge CLI";
            homepage = "https://linkerd.io";
            license = licenses.asl20;
            platforms = [ "aarch64-darwin" ];
            mainProgram = "linkerd";
          };
        };
      })
    ];
  };
in
{
  # Work machine packages — k8s, cloud, and infra tooling
  environment.systemPackages = with pkgs; [
    pkgs-master.claude-code
    pkgs-master.llama-cpp
    pkgs-master.linkerd_edge
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

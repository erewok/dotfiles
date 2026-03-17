{
  description = "erewok nix-darwin system";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    nixos-master.url = "github:nixos/nixpkgs/master?shallow=1";
    nix-darwin = {
      url = "github:LnL7/nix-darwin/nix-darwin?shallow=1";
      inputs.nixpkgs.follows = "nixpkgs-darwin";
    };
  };

  outputs = { self, nix-darwin, nixpkgs }:
  let
    system = "aarch64-darwin";
    pkgs = import nixpkgs { inherit system; };
  in
  {
    # Build darwin flake using:
    darwinConfigurations =
        let
          all =
            ({ modulePath, ... }: {
              imports = [
                ./modules/nix-common
              ];
            });
        in
        {
          "orca" =
            let
              nixpkgs = nixpkgs-darwin;
            in
            nix-darwin.lib.darwinSystem {
              system = "aarch64-darwin";
              modules = [
                all
                ./machines/orca/configuration.nix
              ];
              specialArgs = { inherit inputs nixpkgs; };
            };
        };
  };
}

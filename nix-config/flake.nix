{
  description = "erewok nix-darwin system";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    nixos-master.url = "github:nixos/nixpkgs/master?shallow=1";
    nix-darwin = {
      url = "github:LnL7/nix-darwin/nix-darwin?shallow=1";
      inputs.nixpkgs.follows = "nixpkgs-darwin";
    };
    home-manager.url = "github:nix-community/home-manager";
    home-manager.inputs.nixpkgs.follows = "nixpkgs";
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
          "navanax" =
            let
              nixpkgs = nixpkgs-darwin;
            in
            nix-darwin.lib.darwinSystem {
              system = "aarch64-darwin";
              modules = [
                all
                ./machines/navanax/configuration.nix
                home-manager.darwinModules.home-manager
              ];
              specialArgs = { inherit inputs nixpkgs; };
            };
        };
  };
}

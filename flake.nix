{
  description = "erewok nix-darwin system";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    nixos-master.url = "github:nixos/nixpkgs/master?shallow=1";
    nix-darwin = {
      url = "github:LnL7/nix-darwin";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    home-manager.url = "github:nix-community/home-manager";
    home-manager.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { self, nix-darwin, nixpkgs, home-manager, nixos-master }:
  let
    system = "aarch64-darwin";
    pkgs = import nixpkgs { inherit system; };
    inputs = { inherit nixpkgs nixos-master nix-darwin home-manager; };
  in
  {
    darwinConfigurations =
        let
          all =
            ({ modulePath, ... }: {
              imports = [
                ./nix-config/nix-common
              ];
            });
        in
        {
          "navanax" = nix-darwin.lib.darwinSystem {
            system = "aarch64-darwin";
            modules = [
              all
              ./nix-config/machines/navanax/configuration.nix
              home-manager.darwinModules.home-manager
            ];
            specialArgs = { inherit inputs nixpkgs self; };
          };
          "worktop" = nix-darwin.lib.darwinSystem {
            system = "aarch64-darwin";
            modules = [
              all
              ./nix-config/machines/worktop/configuration.nix
              home-manager.darwinModules.home-manager
            ];
            specialArgs = { inherit inputs nixpkgs self; };
          };
        };
  };
}

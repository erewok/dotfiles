# VSCode Configuration Management

This directory contains machine-specific VSCode configurations managed through Nix.

## Files

- `vscode-settings-work.json` - Settings for work machine (worktop)
- `vscode-settings-personal.json` - Settings for personal machine (navanax)
- `vscode-extension-list-work.json` - Extensions list for work machine
- `vscode-extension-list-personal.json` - Extensions list for personal machine

## How It Works

### Settings (Automatic)

Your Nix configuration automatically loads the appropriate settings file:

- **worktop** (work): Uses `vscode-settings-work.json`
- **navanax** (personal): Uses `vscode-settings-personal.json`

Settings are synced automatically when you rebuild your Nix configuration.

### Extensions (Hybrid Approach)

We use a **hybrid approach** for extensions:

1. **Core extensions** are managed via Nix (listed in `configuration.nix`)
2. **All other extensions** can be installed manually via VSCode

This hybrid approach is recommended because:

- Not all extensions are available in nixpkgs
- Extension versions in nixpkgs may lag behind marketplace
- Manual installation is straightforward for extensions you rarely change

### Currently Nix-Managed Extensions

**Work Machine (worktop):**
```nix
- charliermarsh.ruff
- dbaeumer.vscode-eslint
- esbenp.prettier-vscode
- golang.go
- jnoortheen.nix-ide
- mkhl.direnv
- ms-python.python
- ms-python.debugpy
- redhat.vscode-yaml
- rust-lang.rust-analyzer
- tamasfe.even-better-toml
```

**Personal Machine (navanax):**
Same as work machine (lighter set).

## Managing Extensions

### Option 1: Manual Installation (Recommended for Most)

1. Open VSCode
2. Go to Extensions (Cmd+Shift+X)
3. Search and install extensions as needed
4. VSCode will remember them even after Nix rebuilds

### Option 2: Add to Nix Configuration

To add an extension to Nix management:

1. Check if it's available in nixpkgs: https://search.nixos.org/packages?query=vscode-extensions
2. Add to the `extensions` list in your machine's `configuration.nix`

**Example for work machine:**
```nix
extensions = with pkgs.vscode-extensions; [
  # ... existing extensions ...
  ms-azuretools.vscode-docker  # Add this
];
```

3. Rebuild: `darwin-rebuild switch --flake ~/nix-config#worktop`

### Option 3: Fetch from Marketplace (Advanced)

For extensions not in nixpkgs, you can fetch from the marketplace:

```nix
extensions = with pkgs.vscode-extensions; [
  # ... nixpkgs extensions ...
] ++ pkgs.vscode-utils.extensionsFromVscodeMarketplace [
  {
    name = "extension-name";
    publisher = "publisher-name";
    version = "1.0.0";
    sha256 = "sha256-hash-here";
  }
];
```

To get the sha256 hash:
```bash
nix-prefetch-url --type sha256 \
  "https://marketplace.visualstudio.com/_apis/public/gallery/publishers/PUBLISHER/vsextensions/EXTENSION/VERSION/vspackage"
```

## Exporting Your Current Extensions

To save your current extension list:

```bash
# Work machine
code --list-extensions | xargs -L 1 echo > ~/open_source/dotfiles/vscode/extensions-work.txt

# Personal machine
code --list-extensions | xargs -L 1 echo > ~/open_source/dotfiles/vscode/extensions-personal.txt
```

## Applying Changes

After modifying settings files:

```bash
# Work machine
darwin-rebuild switch --flake ~/nix-config#worktop

# Personal machine
darwin-rebuild switch --flake ~/nix-config#navanax
```

Settings will be applied to `~/Library/Application Support/Code/User/settings.json`.

## Migration Notes

- Your extension JSON files contain VSCode's export format (with UUIDs, etc.)
- We don't use these directly in Nix - they're kept for reference
- The hybrid approach means you don't need to convert 70+ extensions to Nix
- Nix manages settings + core extensions; VSCode manages the rest

## Tips

1. **Settings changes**: Edit the appropriate JSON file in this directory, then rebuild
2. **Testing settings**: You can temporarily edit VSCode settings directly, then copy working config back to the JSON file
3. **Keybindings**: To manage keybindings via Nix, create `keybindings-work.json` and `keybindings-personal.json`, then add to your config:
   ```nix
   programs.vscode.keybindings = builtins.fromJSON (builtins.readFile "${dotfilesPath}/vscode/keybindings-work.json");
   ```

## Troubleshooting

**Settings not applying?**
- Check that your Nix rebuild completed successfully
- VSCode settings file is at: `~/Library/Application Support/Code/User/settings.json`
- Nix creates the file; manual edits will be overwritten on next rebuild

**Extensions disappeared?**
- If `mutableExtensionsDir = false`, only Nix-managed extensions are allowed
- Current setup has `mutableExtensionsDir = true` - allows both Nix and manual extensions
- Check `~/.vscode/extensions/` for installed extensions

**Want to fully manage extensions via Nix?**
- Set `mutableExtensionsDir = false` in your configuration
- Add all desired extensions to the Nix config
- Note: This is more work but gives you full reproducibility

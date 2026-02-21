programs.emacs = {
  enable = true;
  package = pkgs.emacs;
  extraPackages = epkgs; [
    epkgs.nix-mode
    epkgs.nixfmt
    epkgs.solarized-theme
  ];
  extraConfig = ''
    (load-theme 'solarized-light)
    (setq prelude-theme 'solarized-light)
    (custom-set-faces 
      '(default ((t (:height 180 :weight normal :width expanded :family "Monaco")))))
    (global-set-key (kbd "C->") 'next-buffer)
    (global-set-key (kbd "C-<") 'previous-buffer)
    
  ''
};

ff(defvar *emacs-load-start* (current-time))

(setq dotfiles-dir (file-name-directory
		    (or load-file-name (buffer-file-name))))

(prefer-coding-system 'utf-8)
(setq default-buffer-file-coding-system 'utf-8)

;; Use package management!
(require 'package)

(setq package-archives
      (append '(("melpa" . "https://melpa.org/packages/")
		("gnu" . "https://elpa.gnu.org/packages/")
		("marmalade" . "https://marmalade-repo.org/packages/"))
              package-archives))

(package-initialize)

(setq package-list '(abyss-theme
		     cider
		     coffee-mode
		     column-marker
		     company
		     concurrent
		     csv-mode
		     ctable
		     dash
		     deferred
		     epc
             elpy
		     f
		     fill-column-indicator
		     flx
		     flx-ido
		     flycheck
		     flymake-coffee
             flymake-cursor
		     flymake-easy
		     flymake-haskell-multi
		     flymake-jslint
		     flymake-python-pyflakes
		     flymake-sass
		     flymake-yaml
		     ghc
		     ghci-completion
		     haskell-mode
		     helm
		     helm-projectile
             hindent
             idle-highlight-mode
		     jade-mode
		     jedi
		     js2-mode
		     json-mode
		     less-css-mode
		     markdown-mode
		     material-theme
		     monokai-theme
		     multiple-cursors
		     org
		     paredit
		     pkg-info
		     popup
		     projectile
		     py-autopep8
             python-pep8
		     python-environment
		     python-info
		     python-mode
		     queue
		     rainbow-delimiters
		     rainbow-mode
		     s
		     scss-mode
		     simple-httpd
		     skewer-mode
		     solarized-theme
		     tabbar
		     tox
		     ubuntu-theme
		     undo-tree
		     virtualenv
		     warm-night-theme
		     web-mode
		     writeroom-mode
		     yaml-mode
		     zenburn-theme
		     ))

;; rm -rf ~/.emacs.d/elpa to reload
(when (not package-archive-contents)
  (package-refresh-contents))

(dolist (package package-list)
  (when (not (package-installed-p package))
    (package-install package)))

(global-set-key (kbd "C->") 'next-buffer)
(global-set-key (kbd "C-<") 'previous-buffer)
(global-set-key (kbd "C-;") 'global-linum-mode)
(global-set-key (kbd "C-x t") 'load-theme)

(tool-bar-mode -1)
(put 'upcase-region 'disabled nil)
(put 'downcase-region 'disabled nil)
(setq-default fill-column 120)
(setq-default indent-tabs-mode nil)
(setq-default tab-width 4)
(setq indent-line-function 'insert-tab)
(add-hook 'text-mode-hook 'turn-on-auto-fill)
(add-hook 'after-init-hook 'global-flycheck-mode)
(setq ring-bell-function 'ignore)
(add-hook 'before-save-hook 'delete-trailing-whitespace)

;; Fix desktop lock anyway prompt
;; (setq desktop-base-lock-name
;;       (convert-standard-filename (format ".emacs.desktop.lock-%d" (emacs-pid))))

;; auto-complete
(add-to-list 'load-path "~/.emacs.d/auto-complete/")
(load-library "ac-config.el")

;; flycheck
(require 'flycheck)
(add-hook 'after-init-hook #'global-flycheck-mode)

;; Haskell
(add-to-list 'load-path "~/.emacs.d/haskell/")
(load-library "haskell-config.el")
;; Override haskell-mode's BS.
(global-set-key (kbd "M-n") 'next-error)
(define-key interactive-haskell-mode-map (kbd "M-n") 'next-error)

(require 'fill-column-indicator)
(require 'column-marker)
(set-face-background 'column-marker-1 "red")

;; highlight-symbol
(add-to-list 'load-path "~/.emacs.d/idle-highlight/")
(load-library "idle-highlight.el")

(require 'idle-highlight-mode)
(add-hook 'text-mode-hook (lambda () (idle-highlight-mode t)))
(add-hook 'prog-mode-hook (lambda () (idle-highlight-mode t)))
(setq idle-highlight-idle-time 0.5)

;; JavaScript
(require 'js2-mode)
(add-to-list 'auto-mode-alist '("\\.js[x]?\\'" . js2-mode))

;; JSON
(require 'json-mode)
(add-to-list 'auto-mode-alist '("\\.json\\'\\|\\.jshintrc\\'" . json-mode))

;; Markdown
(require 'markdown-mode)
(add-to-list 'auto-mode-alist
         '("\\.md$" . markdown-mode))

;; Projectile
(require 'projectile)
(global-set-key (kbd "C-c p g") 'projectile-grep)

;; Python
(add-to-list 'load-path "~/.emacs.d/python")
(require 'flymake)
(load-library "flymake-cursor")
(load-library "python-config.el")

;; rainbow-delimiters
(require 'rainbow-delimiters)

;; rainbow-mode for CSS
(require 'rainbow-mode)

;; SCSS
(autoload 'scss-mode "scss-mode")
(add-to-list 'auto-mode-alist '("\\.scss\\'" . scss-mode))
(setq scss-compile-at-save nil)

;; Speedbar
(require 'speedbar)
(speedbar-add-supported-extension ".hs")

;; Tabbar
(add-to-list 'load-path "~/.emacs.d/tabbar")
(if (display-graphic-p)
    (load-library "tabbar-config.el"))

;; Undo Tree
(require 'undo-tree)
(global-undo-tree-mode)

;; yaml-mode
(require 'yaml-mode)
(add-to-list 'auto-mode-alist '("\\.yml\\'" . yaml-mode))

;; default browser
(setq browse-url-browser-function 'browse-url-generic
      browse-url-generic-program "google-chrome")


;; Visuals
(add-to-list 'load-path "~/.emacs.d/color-themes")
;; (load-theme 'misterioso t)
;; (load-theme 'dracula t)
(load-theme 'solarized-light t)
;; (load-theme 'aurora t)
;; (load-theme 'phoenix-dark-pink t)
;; (load-theme 'ubuntu t)
;; (load-theme 'phoenix-dark-mono t)
;;(load-theme 'abyss t)

;; (with-system 'darwin
;;   (custom-set-faces
;;     '(default ((t (:height 160 :family "Ubuntu Mono"))))))

;; (with-system 'gnu/linux
;;   (custom-set-faces
;;     '(default ((t (:height 120 :family "Ubuntu Mono"))))))

;; (when (> (display-pixel-height) 1080)
;;   ;; retina
;;   (custom-set-faces
;;     '(default ((t (:height 140 :family "Ubuntu Mono"))))))

(setq mac-option-modifier 'meta)

(custom-set-variables
 ;; custom-set-variables was added by Custom.
 ;; If you edit it by hand, you could mess it up, so be careful.
 ;; Your init file should contain only one such instance.
 ;; If there is more than one, they won't work right.
 '(css-electric-keys nil)
 '(custom-safe-themes
   (quote
    ("316d29f8cd6ca980bf2e3f1c44d3a64c1a20ac5f825a167f76e5c619b4e92ff4" "8aebf25556399b58091e533e455dd50a6a9cba958cc4ebb0aab175863c25b9a4" "d677ef584c6dfc0697901a44b885cc18e206f05114c8a3b7fde674fce6180879" "870a63a25a2756074e53e5ee28f3f890332ddc21f9e87d583c5387285e882099" default)))
 '(haskell-notify-p t)
 '(haskell-process-args-ghci (quote nil))
 '(haskell-process-auto-import-loaded-modules t)
 '(haskell-process-log t)
 '(haskell-process-reload-with-fbytecode nil)
 '(haskell-process-show-debug-tips nil)
 '(haskell-process-suggest-haskell-docs-imports t)
 '(haskell-process-suggest-hoogle-imports nil)
 '(haskell-process-suggest-remove-import-lines t)
 '(haskell-process-type (quote stack-ghci))
 '(haskell-process-use-presentation-mode t)
 '(haskell-stylish-on-save nil)
 '(haskell-tags-on-save nil)
 '(ido-mode (quote both) nil (ido))
 '(inhibit-startup-screen t)
 '(org-support-shift-select (quote always))
 '(package-selected-packages
   (quote
    (projectile f yaml-mode warm-night-theme virtualenv undo-tree tabbar scss-mode rainbow-mode rainbow-delimiters python-mode pymacs puppet-mode monokai-theme markdown-mode magit json-mode js2-mode ghc flycheck deferred csv-mode company cider auto-complete)))
 '(shift-select-mode t)
 '(shm-auto-insert-bangs t)
 '(shm-auto-insert-skeletons t)
 '(shm-use-hdevtools t)
 '(shm-use-presentation-mode t))
(custom-set-faces
 ;; custom-set-faces was added by Custom.
 ;; If you edit it by hand, you could mess it up, so be careful.
 ;; Your init file should contain only one such instance.
 ;; If there is more than one, they won't work right.
 '(default ((t (:height 120 :weight normal :width expanded :family "Monaco")))))

;; (defun reset-font-theme ()
;;   (interactive)
;;   (set-face-attribute 'default nil
;;                       :weight 'normal
;;                       :height 120
;;                       :width 'expanded
;;                       :family "Monaco")
;;   )
(provide 'init)
;; (reset-font-theme())
;;; init.el ends here

;;; package --- Summary

;;; Commentary:

;;; Code:
(when (>= emacs-major-version 24)
  (require 'package)
  (package-initialize)
  (setq package-archives '(("gnu" . "https://elpa.gnu.org/packages/")
                           ("melpa" . "https://melpa.org/packages/")
			   ))
  )
;; In order to specify needed packages
(if (not (package-installed-p 'use-package))
    (progn
      (package-refresh-contents)
      (package-install 'use-package)))

(require 'use-package)

(custom-set-variables
 ;; custom-set-variables was added by Custom.
 ;; If you edit it by hand, you could mess it up, so be careful.
 ;; Your init file should contain only one such instance.
 ;; If there is more than one, they won't work right.
 '(coffee-tab-width 2)
 '(custom-safe-themes
   (quote
    ("67e998c3c23fe24ed0fb92b9de75011b92f35d3e89344157ae0d544d50a63a72" "40f6a7af0dfad67c0d4df2a1dd86175436d79fc69ea61614d668a635c2cd94ab" "316d29f8cd6ca980bf2e3f1c44d3a64c1a20ac5f825a167f76e5c619b4e92ff4" "d1dbb3c37e11ae8f986ca2d4b6a9d78bb1915fe66f3a6ffab1397cc746c18cba" "21c149e080d562fe9169c8abda51c2f1f9b0a12c89cc2c7a4d9998a758e1cfbd" "9dae95cdbed1505d45322ef8b5aa90ccb6cb59e0ff26fef0b8f411dfc416c552" "3b819bba57a676edf6e4881bd38c777f96d1aa3b3b5bc21d8266fa5b0d0f1ebf" "146d24de1bb61ddfa64062c29b5ff57065552a7c4019bee5d869e938782dfc2a" "cd70962b469931807533f5ab78293e901253f5eeb133a46c2965359f23bfb2ea" "31d3463ee893541ad572c590eb46dcf87103117504099d362eeed1f3347ab18f" "d677ef584c6dfc0697901a44b885cc18e206f05114c8a3b7fde674fce6180879" "8aebf25556399b58091e533e455dd50a6a9cba958cc4ebb0aab175863c25b9a4" default)))
 '(inhibit-startup-screen t)
 '(package-selected-packages
   (quote
    (dockerfile-mode hindent dante hasky-extensions lsp-haskell go-mode s wisi flycheck-yamllint zenburn-theme web-mode use-package tabbar solarized-theme scss-mode salt-mode rainbow-delimiters python-info py-autopep8 material-theme markdown-mode magit less-css-mode json-mode jedi jade-mode intero hi2 helm-projectile haml-mode ghci-completion ghc flymake-yaml flymake-sass flymake-python-pyflakes flymake-jslint flymake-haskell-multi flymake-coffee flx fill-column-indicator f coffee-mode clj-refactor ac-js2))))
(custom-set-faces
 ;; custom-set-faces was added by Custom.
 ;; If you edit it by hand, you could mess it up, so be careful.
 ;; Your init file should contain only one such instance.
 ;; If there is more than one, they won't work right.
 '(default ((t (:height 120 :weight normal :width expanded :family "Monaco")))))
;; (custom-set-faces
;;  ;; custom-set-faces was added by Custom.
;;  ;; If you edit it by hand, you could mess it up, so be careful.
;;  ;; Your init file should contain only one such instance.
;;  ;; If there is more than one, they won't work right.
;;  )

;; General Emacs config: get rid of toolbar, fill-column, show column num, turn off the dang bell, etc.
(tool-bar-mode -1)
(show-paren-mode 1)
(column-number-mode 1)
(global-font-lock-mode 1)
(setq-default fill-column 120)
(setq-default indent-tabs-mode nil)
(setq-default tab-width 4)
(setq indent-line-function 'insert-tab)
(add-hook 'text-mode-hook 'turn-on-auto-fill)
(add-hook 'after-init-hook 'global-flycheck-mode)
(setq ring-bell-function 'ignore)
(add-hook 'before-save-hook 'delete-trailing-whitespace)

;; Some Key Bindings
(global-set-key (kbd "C->") 'next-buffer)
(global-set-key (kbd "C-<") 'previous-buffer)
(global-set-key (kbd "C-;") 'global-linum-mode)
(global-set-key (kbd "C-x t") 'load-theme)

(defvar mp-rad-packages
  '(ac-js2
    clj-refactor
    cider
    coffee-mode
    company
    f
    fill-column-indicator
    ;; flx-ido
    flx
    flycheck
    flymake-coffee
    flymake-haskell-multi
    flymake-jslint
    flymake-python-pyflakes
    flymake-sass
    flymake-yaml
    flymake-easy
    ;; javascript-eslint
    ghc
    ghci-completion
    haml-mode
    haskell-mode
    helm
    helm-projectile
    intero
    hi2
    jedi
    jade-mode
    magit
    markdown-mode
    auto-complete
    epc
    ctable
    concurrent
    material-theme
    multiple-cursors
    org
    paredit
    popup
    projectile
    pkg-info
    epl
    py-autopep8
    python-environment
    deferred
    python-info
    queue
    rainbow-delimiters
    s
    salt-mode
    less-css-mode
    scss-mode
    skewer-mode
    js2-mode
    json-mode
    simple-httpd
    solarized-theme
    tabbar
    web-mode
    yaml-mode
    yasnippet
    zenburn-theme
    ))
(defun mp-install-rad-packages ()
  "Install only the sweetest of packages."
  (interactive)
  (package-refresh-contents)
  (mapc #'(lambda (package)
            (unless (package-installed-p package)
              (package-install package)))
        mp-rad-packages))

;; Change to represent elpa packages path
(add-to-list 'load-path (expand-file-name "/Users/eaker/.emacs.d/elpa/"))

;; Default theme. solarized-dark and zenburn also installed.
(load-theme 'solarized-light t)
(require 'fill-column-indicator)
;; (require 'magit)

(projectile-global-mode)
(setq dired-omit-mode t)

(require 's)
(global-set-key (kbd "C-c c") 's-lower-camel-case)
(require 'helm)
(require 'helm-config)
(require 'rainbow-delimiters)
(add-hook 'prog-mode-hook #'rainbow-delimiters-mode)

;; The default "C-x c" is quite close to "C-x C-c", which quits Emacs.
;; Changed to "C-c h". Note: We must set "C-c h" globally, because we
;; cannot change `helm-command-prefix-key' once `helm-config' is loaded.
(global-set-key (kbd "C-c h") 'helm-command-prefix)
(global-unset-key (kbd "C-x c"))
(define-key helm-map (kbd "<tab>") 'helm-execute-persistent-action) ; rebind tab to run persistent action
(define-key helm-map (kbd "C-i") 'helm-execute-persistent-action) ; make TAB works in terminal
(define-key helm-map (kbd "C-z")  'helm-select-action) ; list actions using C-z

(when (executable-find "curl")
  (setq helm-google-suggest-use-curl-p t))

(setq helm-split-window-in-side-p           t ; open helm buffer inside current window, not occupy whole other window
      helm-move-to-line-cycle-in-source     t ; move to end or beginning of source when reaching top or bottom of source.
      helm-ff-search-library-in-sexp        t ; search for library in `require' and `declare-function' sexp.
      helm-scroll-amount                    8 ; scroll 8 lines other window using M-<next>/M-<prior>
      helm-ff-file-name-history-use-recentf t)

(helm-mode 1)
(global-set-key (kbd "C-|") 'helm-projectile-find-file)

;; https://github.com/bbatsov/projectile
(projectile-global-mode)
(setq projectile-completion-system 'helm)
(helm-projectile-on)
(setq projectile-enable-caching t)
(setq scss-compile-at-save nil)

;; alternate buffer traversal
(autoload 'cycle-buffer                     "cycle-buffer"
  "Cycle forward." t)
(autoload 'cycle-buffer-backward            "cycle-buffer"
  "Cycle backward." t)
(autoload 'cycle-buffer-permissive          "cycle-buffer"
  "Cycle forward allowing *buffers*." t)
(autoload 'cycle-buffer-backward-permissive "cycle-buffer"
  "Cycle backward allowing *buffers*." t)
(autoload 'cycle-buffer-toggle-interesting  "cycle-buffer"
  "Toggle if this buffer will be considered." t)
(global-set-key [(f9)]        'cycle-buffer-backward)
(global-set-key [(f10)]       'cycle-buffer)
(global-set-key [(shift f9)]  'cycle-buffer-backward-permissive)
(global-set-key [(shift f10)] 'cycle-buffer-permissive)


(require 'fill-column-indicator)
(setq fci-rule-width 1)
(setq fci-rule-color "green")
(setq fci-rule-use-dashes "true")
(global-set-key (kbd "M-p M-8") 'fci-mode)

(require 'flymake)
;; (load-library "flymake-cursor")

;; org
(global-set-key (kbd "C-x m") 'org-indent-mode)

;; Tabbar
(require 'tabbar)

(if (not tabbar-mode)
    (tabbar-mode))

(setq tabbar-buffer-groups-function
    (lambda ()
    (list "All Buffers")))

(setq tabbar-buffer-list-function
    (lambda ()
          (remove-if
           (lambda(buffer)
             (find (aref (buffer-name buffer) 0) " *"))
           (buffer-list))))

(global-set-key (kbd "s-{") 'tabbar-backward)
(global-set-key (kbd "s-}") 'tabbar-forward)


;; START PYTHON CONFIGURATION
(setq py-autopep8-options '("--max-line-length=120"))
(setq flycheck-flake8-maximum-line-length 120)
(add-hook 'python-mode-hook 'jedi:setup)
(setq jedi:setup-keys t)                      ; optional
(setq jedi:complete-on-dot t)                 ; optional
(setq jedi:environment-root "jedi")  ; or any other name you like

(add-hook 'python-mode-hook
      (lambda ()
        (setq indent-tabs-mode nil)
        (setq tab-width 4)
        (setq python-indent-offset 4)
        (flycheck-mode)
        (global-set-key (kbd "C-x p") 'py-autopep8)
     ))

(add-hook 'python-mode-hook 'flymake-mode)
(add-to-list 'auto-mode-alist '("\\.py$" . python-mode))
;; END PYTHON CONFIGURATION

;; Org mode stuff
;; (global-set-key "\C-cl" 'org-store-link)
;; (global-set-key "\C-cc" 'org-capture)
;; (global-set-key "\C-ca" 'org-agenda)
;; (global-set-key "\C-cb" 'org-iswitchb)

(require 'salt-mode)
(add-to-list 'auto-mode-alist '("\\.sls$" . salt-mode))

;; Haskell mode
;; (require 'haskell-mode)
;; (add-to-list 'auto-mode-alist '("\\.hs$" . haskell-mode))
;; (add-hook 'after-init-hook #'haskell-mode)
;; (add-hook 'haskell-mode-hook 'intero-mode)

;; (add-hook 'haskell-mode-hook 'haskell-indentation-mode)
;; (add-hook 'haskell-mode-hook 'interactive-haskell-mode)
;; (setq haskell-process-type 'cabal-repl)

;; Javascript mode
(add-to-list 'auto-mode-alist '("\\.js\\'" . js2-mode))
(setq js-indent-level 2)
(defvaralias 'js2-basic-offset 'js-indent-level)
;; (add-to-list 'auto-mode-alist '("\\.jsx?\\'" . js2-jsx-mode))
;; (add-to-list 'interpreter-mode-alist '("node" . js2-jsx-mode))
;; use eslint with web-mode for jsx files
(setq flycheck-eslintrc "~/workspace/beacon/frontend/linters/.eslintrc")


;; Web mode
(defun my-web-mode-hook ()
  "Hooks for Web mode."
  (setq web-mode-markup-indent-offset 2)
  (setq web-mode-css-indent-offset 2)
  (setq web-mode-code-indent-offset 2)
  (setq css-mode-indent-offset 2)
  (setq css-indent-offset 2)
)
(add-hook 'web-mode-hook  'my-web-mode-hook)
(add-hook 'less-css-mode-hook  'my-web-mode-hook)
(add-hook 'scss-sass-mode-hook  'my-web-mode-hook)

(require 'coffee-mode)
(add-to-list 'auto-mode-alist '("\\.coffee$" . coffee-mode))

(add-hook 'coffee-mode-hook  'my-web-mode-hook)


(require 'web-mode)
(add-to-list 'auto-mode-alist '("\\.org\\'" . org-mode))
(add-to-list 'auto-mode-alist '("\\.html?" . web-mode))
(add-to-list 'auto-mode-alist '("\\.css?" . web-mode))
(add-to-list 'auto-mode-alist '("\\.phtml\\'" . web-mode))
(add-to-list 'auto-mode-alist '("\\.tpl\\.php\\'" . web-mode))
(add-to-list 'auto-mode-alist '("\\.jsp\\'" . web-mode))
(add-to-list 'auto-mode-alist '("\\.as[cp]x\\'" . web-mode))
(add-to-list 'auto-mode-alist '("\\.erb\\'" . web-mode))
(add-to-list 'auto-mode-alist '("\\.mustache\\'" . web-mode))
(add-to-list 'auto-mode-alist '("\\.djhtml\\'" . web-mode))
(add-to-list 'auto-mode-alist '("\\.less\\'" . less-css-mode))
(add-to-list 'auto-mode-alist '("\\.jade\\'" . jade-mode))
(add-to-list 'auto-mode-alist '("\\.feature\\'" . feature-mode))

;; jslint and coffee mode
(require 'flymake-jslint)
(add-hook 'js-mode-hook 'flymake-jslint-load)

;; (load "editorconfig")

;;(provide 'init)\n;;; init.el ends here
(put 'upcase-region 'disabled nil)
(put 'downcase-region 'disabled nil)

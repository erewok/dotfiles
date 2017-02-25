;;; Code:
(require 'py-autopep8)
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
	(column-marker-1 fill-column)))

(add-hook 'python-mode-hook 'flymake-mode)
(add-hook 'python-mode-hook 'rainbow-delimiters-mode)
(elpy-enable)
(when (require 'flycheck nil t)
  (setq elpy-modules (delq 'elpy-module-flymake elpy-modules))
  (add-hook 'elpy-mode-hook 'flycheck-mode))
(require 'py-autopep8)
(setq py-autopep8-options '("--max-line-length=120"))
(add-hook 'elpy-mode-hook 'py-autopep8-enable-on-save)
(elpy-use-ipython)

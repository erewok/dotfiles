;; Redirect Emacs's customize-UI writes to a local file (this file is a
;; read-only nix symlink, so Emacs must not try to write back to it).
(setq custom-file (expand-file-name "custom-local.el" user-emacs-directory))

;; Suppress bytecomp warnings from third-party packages (not user config issues)
(setq warning-suppress-types '((bytecomp)))

;; THEME
(prelude-require-packages '(solarized-theme))
(setq prelude-theme 'solarized-light)
(load-theme 'solarized-light t)
(disable-theme 'zenburn)

;; FONT
(set-face-attribute 'default nil
                    :family "JetBrainsMono Nerd Font"
                    :height 200
                    :weight 'normal)

;; KEYBINDINGS: cycle open buffers
(global-set-key (kbd "C->") 'next-buffer)
(global-set-key (kbd "C-<") 'previous-buffer)

;; PYTHON
(add-hook 'python-mode-hook (lambda () (setq tab-width 4)))

;; Python uv: https://mclare.blog/posts/using-uv-in-emacs/
(defun uv-activate ()
  "Activate Python environment managed by uv based on current project directory.
Looks for .venv directory in project root and activates the Python interpreter."
  (interactive)
  (let* ((project-root (project-root (project-current t)))
         (venv-path (expand-file-name ".venv" project-root))
         (python-path (expand-file-name
                       (if (eq system-type 'windows-nt)
                           "Scripts/python.exe"
                         "bin/python")
                       venv-path)))
    (if (file-exists-p python-path)
        (progn
          (setq python-shell-interpreter python-path)
          (let ((venv-bin-dir (file-name-directory python-path)))
            (setq exec-path (cons venv-bin-dir
                                  (remove venv-bin-dir exec-path))))
          (setenv "PATH" (concat (file-name-directory python-path)
                                 path-separator
                                 (getenv "PATH")))
          (setenv "VIRTUAL_ENV" venv-path)
          (setenv "PYTHONHOME" nil)
          (message "Activated UV Python environment at %s" venv-path))
      (error "No UV Python environment found in %s" project-root))))

;; Compatibility shim for Emacs builds without tree-sitter support.
;; treesit-ready-p was introduced in Emacs 29 and requires the binary
;; to be compiled with tree-sitter. Define a no-op fallback if absent.
(unless (fboundp 'treesit-ready-p)
  (defun treesit-ready-p (&rest _) nil))

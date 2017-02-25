module Test where

homeDirectory = "/root/files"

eval boolean = case boolean of
    Literal bool -> bool
    Not b        -> not (eval b)
    And b b'     -> eval b && eval b'
    Or b b'      -> eval b || eval b'

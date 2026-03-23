{ ... }:
{
  # Docker Desktop login agent — opens Docker on user login
  launchd.user.agents.docker-desktop = {
    serviceConfig = {
      ProgramArguments = [ "/usr/bin/open" "-a" "Docker" ];
      RunAtLoad = true;
      KeepAlive = false;
    };
  };
}

job "dbuggen" {
  type = "service"

  group "dbuggen" {
    network {
      port "http" {
        to = 3000
      }
    }

    service {
      name     = "dbuggen"
      port     = "http"
      provider = "nomad"
      tags = [
        "traefik.enable=true",
        "traefik.http.routers.dbuggen.rule=Host(`dbu.gg`)",
        "traefik.http.routers.dbuggen.tls.certresolver=default",
      ]
    }

    task "dbuggen" {
      driver = "docker"

      config {
        image = var.image_tag
        ports = ["http"]
      }

      resources {
        memory = 50
      }
    }
  }
}

variable "image_tag" {
  type = string
  default = "ghcr.io/datasektionen/dbuggen:latest"
}

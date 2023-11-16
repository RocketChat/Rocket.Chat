// docker buildx bake [target] --set [target].platform=linux/amd64 --load

group "default" {targets = []}

variable "registry" {
	default = "docker.io"
}

variable "tag" {
	// description = "common tag for all microservice images"
}

variable "monolith_tag" {
	// description = "separate tag for monolith image due to a non release event on the repository"
}

variable "repository_owner" {
	default = "rocketchat"
}

variable "target_monolith_use_alpine" { default = false }

target "base" {
	platforms = ["linux/amd64", "linux/arm64"]
	context = "."
	pull = true
}

function "image_full_name" {
	params = [repo_name]
	result = "${registry}/${repository_owner}/${repo_name}:${tag}"
}

target "monolith" {
	inherits = ["base"]
	dockerfile = target_monolith_use_alpine ? "Dockerfile.alpine" : "Dockerfile"
	context = "/tmp/build"
	tags = ["${registry}/${repository_owner}/rocket.chat:${monolith_tag}"]
}

target "rocketchat-alpine" {
	inherits = ["rocketchat"]
	dockerfile = "Dockerfile.alpine"
}

// if wondering about why not using some way to infer the name of the target and use that for
// args and other stuff, it's not possible as of today - Debdut
target "authorization-service" {
	inherits = ["base"]
	dockerfile = "./ee/apps/authorization-service/Dockerfile"
	args = {
		SERVICE = "authorization-service"
	}
	tags = [image_full_name("authorization-service")]
}

target "account-service" {
	inherits = ["base"]
	dockerfile = "./ee/apps/account-service/Dockerfile"
	args = {
		SERVICE = "account-service"
	}
	tags = [image_full_name("account-service")]
}

target "presence-service" {
	inherits = ["base"]
	dockerfile = "./ee/apps/presence-service/Dockerfile"
	args = {
		SERVICE = "presence-service"
	}
	tags = [image_full_name("presence-service")]
}

target "ddp-streamer-service" {
	inherits = ["base"]
	dockerfile = "./ee/apps/ddp-streamer-service/Dockerfile"
	args = {
		SERVICE = "ddp-streamer"
	}
	tags = [image_full_name("ddp-streamer-service")]
}

target "stream-hub-service" {
	inherits = ["base"]
	dockerfile = "./ee/apps/stream-hub-service/Dockerfile"
	args = {
		SERVICE = "stream-hub-service"
	}
	tags = [image_full_name("stream-hub-service")]
}

target "queue-worker-service" {
	inherits = ["base"]
	dockerfile = "./ee/apps/queue-worker/Dockerfile"
	args = {
		SERVICE = "queue-worker"
	}
	tags = [image_full_name("queue-worker-service")]
}

target "omnichannel-transcript-service" {
	inherits = ["base"]
	dockerfile = "./ee/apps/omnichannel-transcript/Dockerfile"
	args = {
		SERVICE = "omnichannel-transcript"
	}
	tags = [image_full_name("omnichannel-transcript-service")]
}
group "default" {targets = []}

variable "registry" {
	default = "docker.io"
}

variable "tag" {
}

variable "repository_owner" {
	default = "rocketchat"
}

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
	inherits = [target.base.name]
	dockerfile = "apps/meteor/.docker/Dockerfile"
	tags = ["${image_full_name("rocket.chat")}.official"] // ghcr.io/rocketchat/rocket.chat:pr-xxxx.official
}

target "monolith_alpine" {
	inherits = [target.monolith.name]
	dockerfile = "apps/meteor/.docker/Dockerfile.alpine"
	tags = ["${image_full_name("rocket.chat")}.alpine"]
}

target "preview" {
	inherits = [target.monolith.name]
	dockerfile = "apps/meteor/.docker-mongo/Dockerfile"
	tags = ["${image_full_name("rocket.chat")}.preview"]
}

// if wondering about why not using some way to infer the name of the target and use that for
// args and other stuff, it's not possible as of today - Debdut
target "authorization-service" {
	inherits = [target.base.name]
	dockerfile = "./ee/apps/authorization-service/Dockerfile"
	args = {
		SERVICE = "authorization-service"
	}
	tags = [image_full_name("authorization-service")]
}

target "account-service" {
	inherits = [target.base.name]
	dockerfile = "./ee/apps/account-service/Dockerfile"
	args = {
		SERVICE = "account-service"
	}
	tags = [image_full_name("account-service")]
}

target "presence-service" {
	inherits = [target.base.name]
	dockerfile = "./ee/apps/presence-service/Dockerfile"
	args = {
		SERVICE = "presence-service"
	}
	tags = [image_full_name("presence-service")]
}

target "ddp-streamer-service" {
	inherits = [target.base.name]
	dockerfile = "./ee/apps/ddp-streamer/Dockerfile"
	args = {
		SERVICE = "ddp-streamer"
	}
	tags = [image_full_name("ddp-streamer-service")]
}

target "stream-hub-service" {
	inherits = [target.base.name]
	dockerfile = "./ee/apps/stream-hub-service/Dockerfile"
	args = {
		SERVICE = "stream-hub-service"
	}
	tags = [image_full_name("stream-hub-service")]
}

target "queue-worker-service" {
	inherits = [target.base.name]
	dockerfile = "./ee/apps/queue-worker/Dockerfile"
	args = {
		SERVICE = "queue-worker"
	}
	tags = [image_full_name("queue-worker-service")]
}

target "omnichannel-transcript-service" {
	inherits = [target.base.name]
	dockerfile = "./ee/apps/omnichannel-transcript/Dockerfile"
	args = {
		SERVICE = "omnichannel-transcript"
	}
	tags = [image_full_name("omnichannel-transcript-service")]
}

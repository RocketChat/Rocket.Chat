node (label: 'linux') {
	def workspace = "/var/lib/jenkins/workspace/${env.JOB_NAME}"
	def pullRequestDetails = ""
	def commitHash = ""
	def originBranch = ""
	def isDevelop = env.BRANCH_NAME == "develop"
	def releaseVersion = ""
	
	try
	{	
		ws(workspace) {
			stage ('Docker Prepare Workspace') {
				try {
					sh "rm -rf ${workspace}"
				}
				catch (ex) {}
			}
			stage ('Docker Checkout') {
				git branch: env.BRANCH_NAME, credentialsId: 'b4897104-66f2-48d0-bb2d-1cfd7ce2cfc2', url: 'https://github.com/drivevelocity/Rocket.Chat.git'
				commitHash = sh(returnStdout: true, script: "git rev-parse HEAD").trim()
				pullRequestDetails = getPullRequestDetails(commitHash)
				
				if (pullRequestDetails) {
					originBranch = pullRequestDetails.base.ref
				} else {
					originBranch = 'develop'
				}
				sh 'git checkout develop'
				sh 'git checkout ' + env.BRANCH_NAME
				
				def gitVersion = sh(returnStdout: true, script: 'docker run --rm -v "$(pwd):/repo" -u $(id -u):$(id -g) gittools/gitversion:5.0.0-linux-centos-7-netcoreapp2.2 /repo /showvariable semver').trim()

				releaseVersion = gitVersion + ".${env.BUILD_NUMBER}"
			}
            stage ('Build') {
                sh './build-container.sh'
            }
			stage ('Docker Publish') {
                withCredentials([file(credentialsId: 'f30f3138-c4ed-41d1-ac35-b019d16aafe2', variable:'aws_credentials')]) {
		            env.AWS_SHARED_CREDENTIALS_FILE = aws_credentials
		            env.AWS_PROFILE = "mgmt"
		            env.AWS_DEFAULT_REGION = "us-east-1"

                    def dockerLoginCommand = sh(returnStdout: true, script: 'aws ecr get-login --no-include-email --region us-east-1').trim()

                    sh dockerLoginCommand

				    pushImage('rocketchat', releaseVersion);
                }
			}
			stage ('Cleanup') {
				try {
					sh "rm -rf ${workspace}"
				}
				catch (ex) {}
			}
		}
	} catch (e) {
		currentBuild.result = "FAILURE"
		try {
			sh "rm -rf ${workspace}"
		}
		catch (ex) {}
	}
}

def pushImage(serviceName, releaseVersion) {
    def docker_repo = "476851419095.dkr.ecr.us-east-1.amazonaws.com"

	sh ("docker tag \$(docker images | grep -E '^$serviceName .*latest' | awk '{print \$3}') $docker_repo/$serviceName:$releaseVersion")
	sh ("docker tag \$(docker images | grep -E '^$serviceName .*latest' | awk '{print \$3}') $docker_repo/$serviceName:latest")
	sh ("docker push $docker_repo/$serviceName:$releaseVersion")
	sh ("docker push $docker_repo/$serviceName:latest")
}

def getVersion(gitVersionString) {
	def version = readJSON text: gitVersionString
	return version['FullSemVer']
}

def getPullRequestDetails(commitHash) {
	def issuesUrl = "https://api.github.com/search/issues?q=sha:${commitHash}+is:pr+is:open"
	def issueResponse = httpRequest authentication: 'b4897104-66f2-48d0-bb2d-1cfd7ce2cfc2', httpMode: 'GET', responseHandle: 'STRING', url: issuesUrl
	
	def issueResponseJson = readJSON text: issueResponse.content

	if(issueResponseJson['total_count'] > 0) {
		def pullRequestId = issueResponseJson['items'][0]['number']
		
		def prUrl = "https://api.github.com/repos/drivevelocity/Rocket.Chat/pulls/${pullRequestId}"
		def prResponse = httpRequest authentication: 'b4897104-66f2-48d0-bb2d-1cfd7ce2cfc2', httpMode: 'GET', responseHandle: 'STRING', url: prUrl
	
		def prResponseJson = readJSON text: prResponse.content
	
		return prResponseJson
	} else {
		return null
	}
}
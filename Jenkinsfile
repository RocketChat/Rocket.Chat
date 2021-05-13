node (label: 'linux') {
    def workspace = "/var/lib/jenkins/workspace/${env.JOB_NAME}"
    def pullRequestDetails = ""
    def commitHash = ""
    def originBranch = ""
    def isDevelop = env.BRANCH_NAME == "develop"
    def releaseVersion = ""
    def tagName = ""

    // Change this to develop once you can
    def defaultBranch = "main"

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
                    originBranch = defaultBranch
                }
                sh "git checkout ${defaultBranch}"
                sh 'git checkout ' + env.BRANCH_NAME

                def gitVersion = sh(returnStdout: true, script: 'docker run --rm -v "$(pwd):/repo" -u $(id -u):$(id -g) gittools/gitversion:5.6.1-alpine.3.12-x64-5.0 /repo /showvariable semver').trim()

                releaseVersion = gitVersion + ".${env.BUILD_NUMBER}"
                tagName = getTagName('rocketchat', releaseVersion);
            }
            stage ('Build') {
                def path = './.docker/'
                buildImage(path, tagName, releaseVersion)
            }
            stage ('Docker Publish') {
                withCredentials([file(credentialsId: 'f30f3138-c4ed-41d1-ac35-b019d16aafe2', variable:'aws_credentials')]) {
                    env.AWS_SHARED_CREDENTIALS_FILE = aws_credentials
                    env.AWS_PROFILE = "mgmt"
                    env.AWS_DEFAULT_REGION = "us-east-1"

                    def dockerLoginCommand = sh(returnStdout: true, script: 'aws ecr get-login --no-include-email --region us-east-1').trim()

                    sh dockerLoginCommand

                    pushImage(tagName);
                }
            }
            stage ('Cleanup') {
                removeLocalDockerImage(tagName)
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

def getTagName(serviceName, releaseVersion) {
    def docker_repo = '476851419095.dkr.ecr.us-east-1.amazonaws.com'
    def tagName = "${docker_repo}/${serviceName}:${releaseVersion}"
    echo "tagname: ${tagName}"
    return "${tagName}"
}

def buildImage(path, tagName, releaseVersion) {
    sh('''
    # creates a nodejs app bundle
    set -x
    TMP=$(mktemp -ud -t rocketchat-build-XXXXXXXXXXXX --tmpdir=/home/$USER/tmp)
    rm -rf $TMP

    meteor  npm install --allow-superuser
    meteor build --directory $TMP --allow-superuser

    # create docker image
    cp ''' + path + '''Dockerfile $TMP
    cd $TMP
    docker build -t ''' + tagName + ''' --build-arg APP_VERSION=''' + releaseVersion + ''' .
    rm -rf $TMP
    ''')
}

def pushImage(tagName) {
    if (tagName) {
        echo "pushing ${tagName}"
        sh ("docker push ${tagName}")
    }
    else {
        echo 'cant push, tag name missing'
    }

}

def removeLocalDockerImage(tagName) {
    if (tagName) {
        echo "removing image ${tagName}"
        sh ("docker rmi -f ${tagName}")
    }
    else {
        echo 'cant remove, tag name missing'
    }
}

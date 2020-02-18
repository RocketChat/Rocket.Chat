FROM gitpod/workspace-full

USER gitpod

RUN sudo apt install git-all \
    && curl https://install.meteor.com/ | sh

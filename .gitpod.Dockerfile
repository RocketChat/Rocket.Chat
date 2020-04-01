FROM gitpod/workspace-full

USER gitpod

RUN curl https://install.meteor.com/ | sh

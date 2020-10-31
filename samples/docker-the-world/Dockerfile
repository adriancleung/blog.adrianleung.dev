# Base image to start a container with. This could be an operating system
# or another docker image made by yourself or others.
FROM alpine:latest

# RUN instruction runs shell commands like installing packages
RUN apk add --update npm

# WORKDIR sets the working directory for RUN, CMD, ENTRYPOINT, COPY, and ADD
WORKDIR /data/

# COPY copies from a certain volume to the image
COPY . /data/

# This RUN instruction will install the necessary dependencies for the app
RUN npm install

# This COPY will copy the entrypoint script to the root directory
COPY docker-entrypoint.sh /

# To make the script executable, we use RUN to change the permission
RUN chmod 700 /docker-entrypoint.sh

# EXPOSE allow ports to be exposed to the host
EXPOSE 3000

# CMD provides the default behaviour when executing a container
# This will run the entrypoint script when the container is executed
CMD [ "/docker-entrypoint.sh" ]
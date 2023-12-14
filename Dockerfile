FROM ubuntu:22.04
RUN mkdir -p /cloudsploit
COPY . /cloudsploit
# Install Node.js 18.x and npm 10.x
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get update -y
RUN apt-get install -y nodejs npm

# Set the working directory
WORKDIR /cloudsploit
RUN npm install
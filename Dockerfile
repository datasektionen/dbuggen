FROM docker.io/ruby:3.1 AS build

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive
RUN apt update && apt install -y nodejs && rm -rf /var/lib/apt/lists/*

COPY . .

# Ensure bundler version matches the one in Gemfile.lock (2.4.15)
RUN gem install bundler -v 2.4.15
RUN bundle install

RUN jekyll build

FROM docker.io/busybox:1-musl
WORKDIR /app

COPY --from=build /app/_site /app

EXPOSE 3000
CMD ["httpd", "-fp3000"]

FROM docker.io/ruby:2.7.6 AS build

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive
RUN apt update && apt install -y nodejs && rm -rf /var/lib/apt/lists/*

COPY . .

RUN bundle install

RUN jekyll build

FROM docker.io/busybox:1-musl
WORKDIR /app

COPY --from=build /app/_site /app

EXPOSE 3000
CMD ["httpd", "-fp3000"]

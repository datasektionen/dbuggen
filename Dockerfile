FROM docker.io/node:22-bookworm-slim AS node
FROM docker.io/ruby:3.1-bookworm AS build

WORKDIR /app

# Both toolchains are build-time only; the runtime still serves static files.
COPY --from=node /usr/local/ /usr/local/

COPY Gemfile Gemfile.lock ./
RUN gem install bundler -v 2.4.15 && bundle install

COPY apps/dnd/package.json apps/dnd/package-lock.json ./apps/dnd/
RUN npm --prefix apps/dnd ci

COPY . .
RUN bundle exec rake dnd:test assets:precompile

FROM docker.io/busybox:1-musl
WORKDIR /app

COPY --from=build /app/_site /app

EXPOSE 3000
CMD ["httpd", "-fp3000"]

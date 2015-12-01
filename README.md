# dbuggen
Datasektionens tidning, fast på webben! Även sektionens mest seriösa repo på github.

dbu.gg är en jekyll-app. För att kunna deployas på dokku är den dock fulhackad till en Rack-app.

### Setup

```
gem install bundler
bundle install
bundle exec jekyll serve -w
```
Site is now served at `localhost:9000`

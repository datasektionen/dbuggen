# dbuggen
Datasektionens tidning, fast på webben! Även sektionens mest seriösa repo på github.

dbu.gg är en jekyll-app. För att kunna deployas på dokku är den dock fulhackad till en Rack-app.

### Setup
Install ruby and ruby-dev
```
$ sudo apt-get install ruby
$ sudo apt-get install ruby-dev
```

Install bundler
```
$ gem install bundler
```

Install gems
```
$ bundle
```

Run rake to start a local development server
```
$ rake
```

Site is now live at `localhost:9000`


### Deploying
dbuggen is hosted on datasektionens dokku server. To deploy, first ask someone important to add your ssh key in the right place. Then, push to the remote `git push dokku@medusa.datasektionen.se:dbuggen` to deploy.

Here's a bunch of other, maybe relevant, commands
```sh
# shows a list of commands
ssh dokku@medusa.datasektionen.se

# Other executable commands:
ssh dokku@medusa.datasektionen.se <command>
# Ex: show dbuggen status
ssh dokku@medusa.datasektionen.se ps:report dbuggen
# Ex: see logs for dbuggen
ssh dokku@medusa.datasektionen.se logs dbuggen
# Ex: see logs as new information comes in
ssh dokku@medusa.datasektionen.se logs dbuggen -t
```
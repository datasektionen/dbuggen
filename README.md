# dbuggen
Datasektionens tidning, fast på webben! Även sektionens mest seriösa repo på github.

dbu.gg är en jekyll-app. För att kunna deployas på dokku är den dock fulhackad till en Rack-app.

### Setup

If you need to, install bundler  
`gem install bundler`

Install gems  
`bundle`

Run rake to start a local development server  
`rake`

Site is now live at `localhost:9000`

### Deploying
dbuggen is hosted on a dokku server. To deploy, first ask someone important to add your ssh key in the right place. Then, push to the remote `dokku@glass.datasektionen.se:dbuggen` to deploy.

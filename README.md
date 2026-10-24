# dbuggen

Datasektionens tidning, fast på webben! Även sektionens mest seriösa repo på GitHub.

[Dbuggen](https://dbu.gg) byggs med Jekyll. DND-appen
[Ödets Kast](https://dbu.gg/dnd/) öppnas med tärningsknappen på startsidan.
I DND finns en länk tillbaka.

## Kör lokalt

Du behöver Ruby med utvecklingsverktyg, Bundler 2.4.15 och Node.js 22.12 eller senare.

```sh
gem install bundler -v 2.4.15
bundle install
npm --prefix apps/dnd ci
bundle exec rake
```

Öppna [Dbuggen](http://localhost:9000) eller [DND](http://localhost:9000/dnd/).
Jekyll bygger om Dbuggen när du ändrar filer. Efter ändringar i DND, kör detta
i en annan terminal:

```sh
bundle exec rake dnd:build
```

För hot reload i DND, kör `npm --prefix apps/dnd run dev` och lägg till `/dnd/`
i adressen som visas. Använd Jekyll för att testa båda sidorna tillsammans.

## Kör med Docker

```sh
docker compose up --build
```

Öppna [Dbuggen](http://localhost:4000) eller [DND](http://localhost:4000/dnd/).
Efter ändringar i DND, kör `docker compose exec jekyll bundle exec rake dnd:build`.

## Filer

- `apps/dnd/`: DND:s källkod, låsfil och tester. Gör ändringar här.
- `dnd/`: Vites byggresultat. Ska inte redigeras eller läggas till i Git.
- `_site/`: hela webbplatsen, klar att publicera.

Vite bygger DND för sökvägen `/dnd/`. Appen har egen CSS som inte påverkar Dbuggen.
DND sparar data lokalt i webbläsaren med localStorage.

## Testa och bygg

```sh
bundle exec rake dnd:test
bundle exec rake assets:precompile
```

`assets:precompile` bygger både DND och Dbuggen. Använd det i stället för
`jekyll build`.

För att testa samma Docker-image som används i produktion:

```sh
docker build -t dbuggen .
docker run --rm -p 3000:3000 dbuggen
```

Öppna http://localhost:3000.

## Driftsättning

En push till `master` startar GitHub Actions. Det bygger Docker-imagen, kör
testerna och driftsätter via `datasektionen/nomad-deploy`. Om bygget eller testerna
misslyckas avbryts driftsättningen. Dbuggen och DND körs i samma tjänst på `dbu.gg`.

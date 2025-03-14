---
title: "Den objektivt bästa bioplatsen"
category: 29
order: 6
author: "A. Burrito et al."
---
## Introduktion

Mot slutet ta av hösten fick dbuggen in ett brev från en av sina läsare:

> Hej Redaqtionen, jag har en fråga. Vilken är egentligen den bästa platsen när man går på bio? Jag och mina vänner blir alltid osams. Vänligen hjälp oss snälla.

Då dbuggen gärna vill pröva sina vingar som pseudovetenskaplig publikation har vi tagit hjälp av våra vänner vid _skolan för biokemi och bio-grafteori_ för att studera frågan närmare.

## Bakgrund

I Sverige har [Filmstaden](https://www.filmstaden.se) (f.d. SF) länge haft i stort sett monopol på den svenska biomarknaden, med en [uppskattad 95% stor marknadsandel i storstäderna](https://jenslanestrand.wordpress.com/2018/12/07/nordisk-film-bio-ar-valkommen-ny-aktor-pa-svenska-marknaden/). Den moderna människan går inte längre till biografen för att köpa en biljett utan bokar rentav plats direkt på hemsidan med hjälp av den s.k. [platsväljaren](https://biolabbet.filmstaden.se/smidigare-kopflode-pa-var-nya-beta-sajt/). Detta fantastiska verktyg visar vilka bioplatser som redan är köpta eller reserverade och vilka som fortfarande är lediga vid en given tidpunkt, för en viss filmvisning.

## Metod
Ett sätt att få klarhet i denna fråga utan att behöva lyssna på en massa dryga människors jobbiga åsikter är istället att, helt enkelt, observera dem i hemlighet.

Genom att observera vilka bioplatser som går åt först bör vi kunna få en fingervisning om vilka platser som är de mest eftertraktade. Detta kommer av det faktum att de som är tidiga med att köpa biljett har störst möjlighet att välja sin plats fritt och kan därav med större sannolikhet välja den plats som hon eller han _tycker är **bäst**_. Ifall bara den första biljettköparen vid varje filmvisning skulle observeras löper vi risken att få gles data. Men ifall vi observerar för många riskerar vi att observera köpare med för lite valfrihet för att informationen ska vara relevant i detta resonemang.

Därav har vi bestämt att endast observera filmvisningar med färre än 1/5 köpta platser. Då har samtliga observerade köpare haft minst 80% valfrihet och som resultat av detta kommer de 20% mest eftertraktade bioplatserna registreras. Givet ett tillräckligt stort underlag bör ett opinionsbaserat resultat kunna avläsas.

I praktiken kommer jag inte lurka utanför biografer utan i själva verket observera den s.k. _platsväljaren_ (shit va otippat) på [www.filmstaden.se](https://www.filmstaden.se) tills en statistiskt säker mängd data har analyserats.

Nedan följer ett kort stycke väldigt diskret matematik som bevisar att resonemanget är korrekt:

<img class="svg" src="https://imgur.com/7kEy60Q.png">

### Avgränsningar

Undersökningen kommer bara kolla på biografer och biljettköp i Stockolmsområdet under slutet av 2018 och början av 2019. Vidare kommer samtliga biografer analyseras i grupp; oavsett skillnader i form och mängd platser.

För att kunna jämföra platsköp vid biografer av olika form och layout kommer varje biograf betraktas som en matris av koordinatvektorer. Denna matris kommer sedan linjärtransformeras m.h.a. enhetskvadraten varpå alla platsköp kan jämföras med korrekta proportioner i förhållande till stolarnas position i biografen.

## Resultat
Efter att ha surfat in på _platsväljaren_ för samtliga filmvisningar, tre gånger om dagen i 91 dagar har en tillräcklig mängd data insamlats för att resultatet inte ska variera mer än 2% per 10% bortfall av godtycklig data. Sammanlagt har ca. 600'000 biljettköp observerats varav ungefär 125'000 av dessa från filmvisningar med mer än 80% lediga platser.

<img class="svg" src="https://imgur.com/yKBezYX.png">

Dessa två till synes kanske mystiska kurvor beskriver fördelningen av köpta platser i både _x- och y-led_; d.v.s. till höger/vänster respektive fram/bak i biografen. Diagrammets intervall sträcker sig från 0 till 1, där position (0, 0) motsvarar längst ned till vänster, närmast bioduken, och (1, 1) motsvarar högst upp till höger, längst bak i biografen.

Den blåa kurvan, som beskriver platsfördelningen parallellt med bioduken, visar en tydlig trend att sitta så nära mitten som möjligt. Den röda kurvan, som alltså beskriver platsfördelningen vinkelrätt mot bioduken är mer varierad men har ett överlägset störst lokalt maximum längst bak i biografen.

För att bättre illustrera fördelningen på ett sätt som mer liknar den vy som en användare av Filmstadens platsväljare ser, så har båda fördelningsfunktionerna kombinerats för att skapa en najs heatmap: 🔥🗺️  

<img class="svg" src="https://imgur.com/eI79Znj.png">

Detta diagram visar låg frekvens i en mörk blå ton, respektive mycket hög frekvens i en mörk röd ton. På motstående sida av diagrammets koordinataxlar visas motsvarande fördelningsfunktion. För att ge bilden lite mer sammanhang kan jag påpeka att bioduken alltså motsvaras av **x-axeln** i denna jämförelse.

## Diskussion

Även om fördelningsfunktionerna duger alldeles utmärkt för att tyda vilka delar av biografen som är mest populära kan även heatmapen ovan avslöja ett och annat. Till exempel så visar avläsning av fördelningsfunktionerna att mittenplatsen längst bak är den i särklass populäraste **enskilda platsen** (eventuellt efterföljt av de två platserna till sidan om den) medan heatmapen illustrerar att det i genomsnitt pouläraste **området** är strax ovanför biografens mittpunkt.

Kopplat till studien _["Vad din plats i biografen säger om dig"](https://utforskasinnet.se/vad-din-plats-i-biografen-sager-om-dig/)_ inser man snabbt att de som är _tidiga med att köpa bioplats_ i genomsnitt är **säkra, beslutsamma och bestämda personer**; en klassisk A-gruppare alltså. Faktumet att de flesta tycks välja platsen längst bak i mitten målar dock upp en annorlunda bild; att dessa personer kanske på insidan är lugna, fridfulla och **lättpåverkade** (1.99‰).

En annan samtida studie [(farmor_gas et al., 2014)](https://www.flashback.org/t2495405) föreslår att raden längst bak på bion även skulle vara den bästa för att hångla på. Kombinerat målar de här insikterna upp en färgstark bild av den person som biogästerna i högsta grad strävar att vara. Skolboksexemplet för den roligaste personen på festen; lättpåverkad och bra på att hångla.

## Slutsats
Mittenplatsen längst bak i biografen är den i särklass bästa. Förvänta tungrullare.
<div style="text-align: right">vsv ⬛️</div>

### Framtida forskning
Denna studie har väckt en hel del frågor om hur bioplats-modellen kan appliceras inom andra områden:
* Är mittenplatsen längst bak i bussen den i särklass coolaste?
* Är mittenplatsen längst bak i föreläsningssalen den i särklass sömnigaste?
* Är mittenplatsen längst bak i plumskön den i särklass sämsta?

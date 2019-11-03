---
title: "Hur många skivor finns det på en gurka?"
category: 32
order: 2
author: "Dr. Gürken"
---

Hur många skivor finns det på en gurka? Frågan som ganska få har ställt sig men som jag ska undersöka. Jag går in i detta uppdrag ovetandes och grön. Det finns variabler när det kommer till gurkor och gurkskivor. Längd, färg, tjocklek på både skivan och gurkan själv. Olika arter och typer av gurkor. Jag tänkte börja med att undersöka gurkan själv, sedan försöka räkna ut hur tunn en skiva faktiskt kan vara. Och med den informationen komma fram till hur många skivor det teoretiskt sett kan finnas i en godtycklig gurka.

## Gurkan
En grön växt som är populär att äta med t.ex. tacos eller på macka. Är även populär att ha på ögonen när man går på spa. Längden på en gurka varierar kraftigt men på hemsidan [svar på allt](https://spa.merinfo.se/question/hur-lang-ar-en-gurka) kan vi läsa att en person en gång hade en gurka som var 36cm lång. Det kommer användas som exempel senare i undersökningen. Övrig intressant fakta är att Kina står för 75,83% av den globala gurkproduktionen och producerar hela 56 855 415 ton gurka per år([källa](https://sv.wikipedia.org/wiki/Gurka)). Imponerade.

## Skivan
Det är viktigt att man inte blandar in andra sorters skivor här. CD-skivan är(var) bra som lagringsmedium, men inte som mackpålägg. En kräftskiva brukar vara rolig, men man vill inte ha ruttnande kräftskal och dåliga fyllebeslut någonstans i närheten av denna forskning. Det är alltså grönsaken(eller bäret enligt wikipedia) gurka och dess skivor som gäller. Den viktiga frågan är alltså hur tunt man kan skiva en gurka. Man kan ju tänka sig att man står hemma i köket och försöker skiva så tunt man kan. När man är nöjd tar man fram sitt skjutmått och mäter tjockleken. Detta är en bra utgångspunkt och ger en tydlig bild av vad tunna skivor innebär. Men jag vill gå djupare, jag vill matematiskt hitta den tunnast möjliga skivan. En snabb googling leder mig in på Lunds universitets hemsida, hos deras mekanikavdelning. En [formelsamling](http://www.mek.lth.se/fileadmin/mek/Education/FMEA05oFMEA15/formelsamling.pdf) senare hittar vi satsen om tunna skivor.

<img class="svg" src="https://dbuggen.s3.amazonaws.com/4_19/tunn-skiva.png">

Man ser direkt att tjockleken hos skivan I<sub>zz</sub> består av två komponenter I<sub>xx</sub> och I<sub>yy</sub>. Det ger oss två saker, först att den består av en komponent och sedan att det är en till. Satsen används ursprungligen till att räkna ut krispigheten mot tjocklek hos vissa gurkskivor, men vi kan använda den för att se hur tunn en skiva kan vara och fortfarande räknas som en gurkskiva. Satsen ger skivan I<sub>zz</sub> tjocklek i millimeter. Scrollar vi vidare i formelsamlingen ser vi hur vi räknar ut dessa I-värden.

<img class="svg" src="https://dbuggen.s3.amazonaws.com/4_19/formel-om-cirkel.png">

Vi ser att I<sub>x</sub> och I<sub>y</sub> är samma. Och eftersom vi använder satsen om tunna skivor kan vi inte direkt använda I<sub>z</sub> utan vi måste använda I<sub>x</sub> och I<sub>y</sub>. För att göra om I<sub>x</sub> till I<sub>xx</sub> och I<sub>y</sub> till I<sub>yy</sub> är det bara att multiplicera ihop två likadana I<sub>x</sub> samt I<sub>y</sub>. Då får vi:

<img class="svg" src="https://dbuggen.s3.amazonaws.com/4_19/forenkling.png">

Med denna förenkling kan vi då räkna ut den teoretiskt sett tunnaste skivan. Variabeln *m*  kommer från romerska siffran för tusen, M, och räknas ut genom att ta gurkarts-konstanten(finns att hitta i BETA-formelsamlingen) dividerat med 1000.  Variabeln *r* står för rigidity och mäts individuellt för varje gurka, alltså inte för radien av cirkeln. Det är en ganska avancerad beräkning och kommer inte täckas i denna undersökning.

## Tunnaste skivan
Så med formeln ovan kan vi då räkna ut tunnaste skivan. Gurksorten med det lägsta värdet för *m* råkar vara den vanliga svenska gurkan, vilket ger värdet på *m* 137/1000 = 0,137. I och med att *r* är olika för gurka till gurka får vi använda det lägsta teoretiska värdet. I artikeln [The genome of the cucumber](https://www.nature.com/articles/ng.475) hittar vi det teoretiska lägsta värdet på *r* som 10,2. Stoppar vi in det i formeln får vi:

<img class="svg" style="height:70%; width:70%; padding-left:14%;" src="https://dbuggen.s3.amazonaws.com/4_19/utrakning.png">

## Antal skivor på en gurka
Så för att få ut antal skivor på en gurka är det bara att dividera gurkans längd med den tunnast möjliga skivan. Allmänt blir då antalet skivor på en gurka av längd *length*:

<img class="svg" style="height:15%; width:15%; padding-left:36%" src="https://dbuggen.s3.amazonaws.com/4_19/allman-formel.png">

och för exemplet ovan:

<img class="svg" style="height:25%; width:27%; padding-left:30%" src="https://dbuggen.s3.amazonaws.com/4_19/utrakning2.png">
<br>
Och där har vi svaret, på en vanlig svensk gurka som är 36cm lång kan du teoretiskt få ut 1475 användbara gurkskivor.

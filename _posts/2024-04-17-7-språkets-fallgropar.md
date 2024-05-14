---
title: "Språkets fallgropar"
category: 39
order: 7
author: "Niklas"
---

Är det inte underbart med språk? Nej, jag talar inte om programmeringsspråk. Det känns som en konstig grej att behöva förklara, men jag tänker att det är bäst att vara på den säkra sidan när cirka 100 % av vår läsarkrets är dataloger. Jag har förvisso vigt min master till att läsa kurser som Kompilatorkonstruktion samt Automater och Språk, så jag har mycket att säga om Elixirs elegans eller Rusts Robusta typsystem som för klassens nördar (ni vet vilka jag menar) tindra med ögonen. Jag ska prata om ett språk som har stora brister – nej, inte Java eller Javascript. Jag ska prata om språk som inte enkelt kan beskrivas i Backus-Naur-form. Jag ska prata om naturliga språk och specifikt svenskan.

Den här texten kommer möjligen få mig att framstå som än mer oskön än jag faktiskt är och som en prenumerant av Språket i P1 (det är jag inte och jag har knappt hört ett enda avsnitt), men jag ska diskutera tre uttryck som jag med varierande grad av övertygelse tycker att alla borde sluta använda sig av.

## Undantaget som bekräftar regeln

Det här är ett intressant uttryck för att det faktiskt har några bra tillämpningar, men som jag hört det används är det mest dumt och väldigt generaliserande. Som ett exempel, tänk dig följande.
- Person A: “Alla killar har ful handstil”
- Person B: “Det stämmer inte, CheFredrik skriver skitsnyggt”
- Person A: “Okej, men CheFredrik är undantaget som bekräftar regeln”
- Person B: “True, ditt påstående stämmer”

Det enda rimliga är att förkasta påstående att “alla killar har ful handstil” eftersom det inte stämmer, men uttrycket används ibland för att förklara bort en outlier för att hävda att det som sagts ändå stämmer. 

En intressant och relevant tolkning av uttrycket däremot (tack Valle för den inputen). Är att jag istället observerar att CheFredrik har en fin handstil och tänker att det är udda, för han är ju kille! Det bekräftar att det finns en regel (eller snarare samband i mitt huvud) att killar tenderar att skriva fult. På så sätt har en observation av något som bryter mönstret fått mig att tänka på att det fanns ett mönster.

En annan tillämpning jag gillar – men aldrig använder – är om du parkerar en bil vid vägkanten. Där står det kanske “Parkering förbjuden första tisdagen varje månad”. Det beskriver då ett undantag, och på köpet bekräftar det att regeln är att du får parkera alla andra dagar.

**Rekommendation**: Sluta använda uttrycket, inte för att det ofta är dumt, utan för att det ofta är generaliserande.

## Medsols och Motsols

“Alla förare roterar motsols” sa en danslärare under en lektion jag var på häromveckan. Jag tycker det är ett kul uttryck eftersom jag visualiserar det i mitt inre på det sättet folk normalt inte avser. Solen går ju som bekant upp i öst och ner i väst i vad som känns som en cirkulär bana över himlavalvet (det heter tydligen [ekliptikan](https://sv.wikipedia.org/wiki/Ekliptikan) för den som är intresserad). Därför tänker jag ibland på medsols som att jag roterar moturs. Att hävda det är däremot befängt och jag antar att medsols kommer från solur och att sådant rör sig från vänster till höger under dagen. Men jag har verkligen ingen relation till solur så solens bana över himlen känns som en bättre referens för mig och därför tänker jag nog lite knäppt på det här.

**Rekommendation**: Överväg att använda mot- och medurs. Men även om du visualiserar medsols som jag, snälla, gör inte livet svårt för dig och alla andra. Rör dig bara medurs. 

## Att flytta fram något (i temporal bemärkelse)

“Jag kan inte då, kan vi flytta fram mötet 15 minuter?” är en fras jag får höra ibland och jag vet inte alltid vilket håll person vill att vi flyttar mötet. Jag är inte den enda som har en komplicerad relation till det här, förra veckan hörde jag två kollegor använda det på olika sätt under samma dag, Språket i P1 gjorde ett inslag om detta och i en tråd på [Facebook](https://www.facebook.com/Spraketip1/posts/-vi-m%C3%A5ste-flytta-fram-onsdagens-m%C3%B6te-n%C3%A4r-blir-det-nya-m%C3%B6tet-d%C3%A5-p%C3%A5-tisdag-eller-t/10158189290675512/) hittar vi svaren, eller? Igen så handlar det om hur vi visualiserar något, i det här fallet något så abstrakt som tid. Tiden rör sig framåt, alltså är en naturlig tolkning av att flyttar mötet i samma riktning som tiden rör sig, alltså senarelägger vi mötet. Men jag tycker att en lika rimlig tolkning är att tiden kommer mot en, och då är det helt plötsligt rimligt att tolka flytta fram som att tidigarelägga. Är det rimligt att säga att tiden kommer mot en? Vi kan ju säga att slutet närmar sig, och det låter ju väldigt mycket som att en tidpunkt förflyttar sig mot oss. Är du inte övertygad? Om vi flyttar fram en punkt på en dagordning under ett möte, kommer den senare eller tidigare. Jag hävdar att tidigare. Min slutsats är i vilket fall att det är ett uttryck som inte har den precision som är lämplig när en tidsbokning görs. 

**Rekommendation**: Använd inte flytta fram. Använd senare- och tidigarelägga.

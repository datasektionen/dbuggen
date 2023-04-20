---
title: "Vad är ens dbuggen?"
category: 36
order: 13
author: "Fredrik"
---
**D-buggen, dbuggen, dBuggen, d-buggen, dbuggtvå… Vad är dbuggen? Jo det är ju en mycket seriös och framförallt samhällsnyttig tidsskrift med ändamål att sprida kunskap och medvetenhet bland gemene datalog. Det är vad dbuggen är, men vad är dbuggen? För att svara på denna fråga behövde jag gräva djupt, men det är vad vi journalister gör.**

Fort Minor beskriver i sin låt Kom ihåg namnet (eng. Remember the name) hur förmågan att komma ihåg, och alltså förstå ett namn, består till 10% av tur, 20% skicklighet, 15% viljestyrke, 5% nöje, 50% smärta och slutligen 100% anledning att komma ihåg namnet. 100% anledning att komma ihåg namnet. Från denna musikaliska studie kan vi alltså konstatera att ord kräver vissa egenskaper för att man ska kunna förstå dem. Fort Minor har genom, förmodligen, åtskilliga år av beräkningar kommit fram till den procentsats han presenterar, men den är specifikt för namn. Jag har inte tillgång till hela studien då den är bakom en betalvägg i och med kommersialisering av vetenskapliga artiklar, och KTHs snålhet, vilket leder till att jag inte har tillgång till Minors modell, därmed behövde jag skapa en egen.

Baserad på Minors studie har jag konstruerat den här koden för att beräkna procentsatserna för att förstå ett ord:

```py
import sys

def generate_name_attributes(name):
	attributes = [
    	"luck", "skill", "creativity", "confidence", "determination",
    	"intelligence", "charm", "humor", "ambition", "adaptability"
	]
	ascii_sum = sum(ord(c) for c in name)
	num_attributes = len(attributes)
	indices = [ascii_sum % num_attributes]

	for _ in range(4):
    	index = (indices[-1] * ascii_sum) % num_attributes
    	while index in indices:
        	index = (index + 1) % num_attributes
    	indices.append(index)

	chosen_attributes = [attributes[i] for i in indices]
	return chosen_attributes

def calculate_percentages(name, chosen_attributes):
	ascii_values = [ord(c) for c in name]
	percentages = [(v % 100) + 1 for v in ascii_values][:len(chosen_attributes)]
	total = sum(percentages)

	# Bug: Rounding with a variable precision might cause the sum to be slightly off 100
	precision = len(name) % 4
	normalized_percentages = [round((p / total) * 100, precision) for p in percentages]

	return normalized_percentages

def main(name):
	print(f"Attributes for {name}:")
	chosen_attributes = generate_name_attributes(name)
	percentages = calculate_percentages(name, chosen_attributes)

	for attribute, percentage in zip(chosen_attributes, percentages):
    	print(f"{percentage:.1f}% {attribute}")

	print("And a hundred percent reason to remember the name")

if __name__ == "__main__":
	if len(sys.argv) < 2:
    	print("Please provide a name as a command-line argument")
	else:
    	name = sys.argv[1]
    	main(name)
```

Denna kod returnerar för dbuggens fall:

```
Attributes for dbuggen:
0.8% creativity
78.6% determination
14.3% ambition
3.2% charm
3.2% confidence
And a hundred percent reason to remember the name
```

Vilket noterbart summeras till 200.1 procentenheter. Det finns bevisligen en bugg någonstans i programmet och vid första anblick kan man dra slutsatsen att det inte finns någon slutsats att dra från detta resultat. Jag skulle däremot argumentera för att det är det här som är dbuggen, att dbugga.

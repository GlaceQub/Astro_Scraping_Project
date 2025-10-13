# Wat is Puppeteer
Puppeteer is een Node.js bibliotheek die wordt gebruikt voor het automatiseren van taken met webbrowsers, met name Google Chrome.

Het biedt functionaliteit voor het openen van webpagina's, het klikken op elementen, het invullen van formulieren, het maken van screenshots en nog veel meer.

Pupppeteer wordt vaak gebruikt voor web scraping, het automatiseren van taken op websites en het testen van webapplicaties. Het stelt ontwikkelaars in staat om op een eenvoudige manier met webbrowsers te communiceren en taken te automatiseren die normaal gesproken handmatig zouden moeten worden uitgevoerd.

## Opdracht 1 - Playstation


### Zelfstudie
Nadat alle dependencies zijn geïnstalleerd, neem je de folderstructuur en de bestanden door. Er is een bestand playstation.js voorzien waarin een functie scrapePlaystations is uitgewerkt. Deze functie bezoekt een pagina van de Coolblue website en zoekt op deze pagina verschillende elementen.

### Beschikbaar controleren
Bestudeer de code van de scrapePlaystations methode. Je moet naast de titel en prijs ook nog de beschikbaarheid van het product zoeken. Je kan dit op basis van de klassenaam doen.

### Filteren
Gebruik de gekende array methods van JavaScript om de lijst met producten te filteren. Zorg ervoor dat enkel de producten overblijven die meer kosten dan 600 euro.

### Printen
Aangezien we met een Node.js applicatie zitten, gaan we onze resultaat moeten printen in de console. Gebruik de juiste methode’s om je gefilterde producten te tonen in je console.

Gebruik in je terminal het commando npm run start om je programma te starten.

Zorg ervoor dat het resultaat van deze opdracht naar een .json bestand wordt uitgevoerd. Dit .json bestand bevat dus de lijst van alle Playstations die duurder zijn dan 600 euro.

## Opdracht 2 - Laptops
Je eerste jaar van de opleiding Programmeren heeft je laptop intensief belast, en het is tijd om een nieuwe laptop aan te schaffen.

Gebruik je kennis van de vorige opdracht om nu op de website van Coolblue verschillende pagina’s met laptops te bezoeken en te zoeken naar laptops binnen je vereiste en budget. Je kan met Puppeteer ook verschillende pagina’s bezoeken en afgaan. Zoek zowel Windows laptops als MacBooks.

Maak van elke laptop een object en toon de naam, prijs, aantal reviews, beschikbaarheid, en specificaties (RAM, processor, opslag en schermbreedte).

Zorg ervoor dat je een lijst hebt met minstens 10 laptops die voldoen aan je eigen criteria voor een nieuwe laptop. Gebruik hier ook weer de nodige array methods die JavaScript ingebouwd heeft.

Zorg hier ook weer dat je een .json bestand aanmaakt met daarin de lijst van de laptops.

## Opdracht 3 - Eigen project
Voor deze opdracht mag je een webscraper schrijven naar keuze. Als je zelf nog geen idee hebt, kan je altijd op het internet wat rondzoeken voor inspiratie.

Een snelle vraag aan Chat-GPT levert bijvoorbeeld al de volgende ideeën op:

- Prijsvergelijking: Schraap prijsinformatie van verschillende e-commerce websites om consumenten te helpen de beste deals te vinden.
- Nieuwsaggregator: Maak een nieuwsaggregator die nieuwsartikelen van verschillende Nederlandse nieuwssites verzamelt en op één plek weergeeft.
- Vastgoedmarktanalyse: Schraap gegevens van vastgoedsites om inzicht te krijgen in de huur- en verkoopprijzen van woningen in verschillende steden in Nederland.
- Weer- en weersvoorspellingsinformatie: Verzamel actuele weerinformatie van verschillende weerwebsites en creëer een weersvoorspellingsmodel.
- Jobmarktanalyse: Schraap vacaturegegevens van jobboards en analyseer trends in de arbeidsmarkt, zoals de vraag naar bepaalde vaardigheden of functietitels.
- Sportstatistieken: Verzamel statistieken, scores en schema's van sportevenementen en creëer een sportnieuws- of statistiekenwebsite.

Maak deze opdracht zo uitgebreid mogelijk. Bekijk de bijhorende rubric indien nodig. Vraag zo veel mogelijk informatie op als je kan en toon dit ook in de console. Gebruik je kennis van programmeren om op basis van voorwaardes bepaalde informatie te tonen.

Zorg ervoor dat het resultaat weer in een .json bestand terecht komt.

## Handige links
[Intro To Web Scraping With Puppeteer – Traversy Media](https://www.youtube.com/watch?v=S67gyqnYHmI)

[Advanced Web Scraping in Puppeteer: Scraping a Bookstore! – Josh tried coding](https://www.youtube.com/watch?v=FKkDUW4E2Qc)

[Puppeteer Guides - Puppeteer](https://pptr.dev/category/guides)